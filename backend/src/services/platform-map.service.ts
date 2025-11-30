import {
  PlatformMapRepository,
  platformMapRepository,
} from "../repositories/platform-map.repository";
import { BaseService } from "./base.service";
import { ServiceError } from "../errors/errors";
import { type IPlatformMap, type IBoothPlacement, type ILandmark } from "../models/platform-map.model";

export class PlatformMapService extends BaseService<
  IPlatformMap,
  PlatformMapRepository
> {
  constructor(repository: PlatformMapRepository) {
    super(repository);
  }

  protected getEntityName(): string {
    return "PlatformMap";
  }

  /**
   * Get the active platform map or create a default one if none exists
   */
  async getActivePlatformMap(): Promise<IPlatformMap> {
    let activePlatform = await this.repository.getActive();
    
    if (!activePlatform) {
      // Create default platform map with larger grid
      activePlatform = await this.repository.create({
        name: "Default Platform Layout",
        gridWidth: 60,
        gridHeight: 20,
        cellSize: 40,
        booths: [],
        landmarks: [],
        isActive: true,
      });
    }
    
    return activePlatform;
  }

  /**
   * Update the platform map configuration
   */
  async updatePlatformMap(
    id: string,
    data: {
      name?: string;
      gridWidth?: number;
      gridHeight?: number;
      booths?: IBoothPlacement[];
      landmarks?: ILandmark[];
    }
  ): Promise<IPlatformMap> {
    const platform = await this.repository.findById(id);
    
    if (!platform) {
      throw new ServiceError("NOT_FOUND", "Platform map not found", 404);
    }

    // Check if any booths are being deleted (present in old but not in new)
    if (data.booths) {
      const newBoothIds = new Set(data.booths.map(b => b.id));
      const deletedBooths = platform.booths.filter(b => !newBoothIds.has(b.id));
      
      console.log('🔍 Update Platform - Checking booth deletions:');
      console.log('  Old booths count:', platform.booths.length);
      console.log('  New booths count:', data.booths.length);
      console.log('  Deleted booths:', deletedBooths.length);
      
      if (deletedBooths.length > 0) {
        console.log('  Validating deletion of:', deletedBooths.map(b => b.label || b.id).join(', '));
        // Validate that deleted booths don't have active reservations
        await this.validateBoothDeletion(deletedBooths);
      }
      
      // Validate booth placements don't overlap
      this.validateBoothPlacements(data.booths, data.gridWidth || platform.gridWidth, data.gridHeight || platform.gridHeight);
    }

    const updated = await this.repository.update(id, {
      ...data,
      updatedAt: new Date(),
    } as any);

    if (!updated) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to update platform map", 500);
    }

    return updated;
  }

  /**
   * Validate that booths being deleted don't have active reservations
   */
  private async validateBoothDeletion(booths: IBoothPlacement[]): Promise<void> {
    console.log('🔒 validateBoothDeletion called for', booths.length, 'booths');
    
    const { vendorApplicationRepository } = await import("../repositories/vendor-application.repository");
    const now = new Date();
    const boothsWithReservations: Array<{ booth: IBoothPlacement; reservations: any[] }> = [];

    for (const booth of booths) {
      console.log(`  Checking booth: ${booth.label || booth.id} (ID: ${booth.id})`);
      
      const upcomingReservations = await vendorApplicationRepository.findAll({
        boothLocationId: booth.id,
        status: "APPROVED",
        type: "PLATFORM",
      } as any, {});
      
      console.log(`    Found ${upcomingReservations.length} approved PLATFORM reservations`);
      
      // Filter for reservations that haven't ended yet
      const activeReservations = upcomingReservations.filter(app => {
        if (app.startDate && app.duration) {
          const endDate = new Date(app.startDate);
          endDate.setDate(endDate.getDate() + (app.duration * 7));
          const isActive = endDate > now;
          console.log(`      Reservation: ${app.companyName}, Start: ${app.startDate}, End: ${endDate}, Active: ${isActive}`);
          return isActive;
        }
        return false;
      });
      
      console.log(`    Active reservations: ${activeReservations.length}`);
      
      if (activeReservations.length > 0) {
        boothsWithReservations.push({ booth, reservations: activeReservations });
      }
    }

    if (boothsWithReservations.length > 0) {
      const errorDetails = boothsWithReservations.map(({ booth, reservations }) => {
        const boothLabel = booth.label || booth.id;
        const reservationDetails = reservations.map(app => {
          const startDate = new Date(app.startDate!).toLocaleDateString();
          const endDate = new Date(app.startDate!);
          endDate.setDate(endDate.getDate() + (app.duration! * 7));
          return `${app.companyName} (${startDate} - ${endDate.toLocaleDateString()})`;
        }).join(', ');
        return `Booth "${boothLabel}": ${reservationDetails}`;
      }).join('; ');
      
      throw new ServiceError(
        "CONFLICT",
        `Cannot delete ${boothsWithReservations.length} booth(s) with active reservations: ${errorDetails}`,
        409
      );
    }
  }

  /**
   * Get available locations for a booth of given size
   */
  async getAvailableLocations(
    width: number,
    height: number
  ): Promise<{ x: number; y: number }[]> {
    const platform = await this.getActivePlatformMap();
    const availableSpots: { x: number; y: number }[] = [];

    // Check each possible position in the grid
    for (let y = 0; y <= platform.gridHeight - height; y++) {
      for (let x = 0; x <= platform.gridWidth - width; x++) {
        if (this.isSpaceAvailable(x, y, width, height, platform.booths)) {
          availableSpots.push({ x, y });
        }
      }
    }

    return availableSpots;
  }

  /**
   * Add a booth to the platform
   */
  async addBooth(boothData: Omit<IBoothPlacement, 'id'>): Promise<IPlatformMap> {
    const platform = await this.getActivePlatformMap();

    // Check if space is available
    if (!this.isSpaceAvailable(boothData.x, boothData.y, boothData.width, boothData.height, platform.booths)) {
      throw new ServiceError("BAD_REQUEST", "Space is not available for this booth", 400);
    }

    // Check bounds
    if (
      boothData.x + boothData.width > platform.gridWidth ||
      boothData.y + boothData.height > platform.gridHeight
    ) {
      throw new ServiceError("BAD_REQUEST", "Booth exceeds platform boundaries", 400);
    }

    const newBooth: IBoothPlacement = {
      id: `booth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: boothData.x,
      y: boothData.y,
      width: boothData.width,
      height: boothData.height,
      isOccupied: boothData.isOccupied,
      applicationId: boothData.applicationId,
      label: boothData.label,
    };

    platform.booths.push(newBooth);
    
    const updated = await this.repository.update(platform.id, {
      booths: platform.booths,
      updatedAt: new Date(),
    } as any);

    if (!updated) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to add booth", 500);
    }

    return updated;
  }

  /**
   * Remove a booth from the platform
   * Validates that booth has no upcoming approved reservations
   */
  async removeBooth(boothId: string): Promise<IPlatformMap> {
    const platform = await this.getActivePlatformMap();
    
    const boothIndex = platform.booths.findIndex((b) => b.id === boothId);
    if (boothIndex === -1) {
      throw new ServiceError("NOT_FOUND", "Booth not found", 404);
    }

    const booth = platform.booths[boothIndex];
    
    // Check for upcoming approved reservations
    const { vendorApplicationRepository } = await import("../repositories/vendor-application.repository");
    const now = new Date();
    
    const upcomingReservations = await vendorApplicationRepository.findAll({
      boothLocationId: boothId,
      status: "APPROVED",
      type: "PLATFORM",
    } as any, {});
    
    // Filter for reservations that haven't ended yet
    const activeReservations = upcomingReservations.filter(app => {
      if (app.startDate && app.duration) {
        const endDate = new Date(app.startDate);
        endDate.setDate(endDate.getDate() + (app.duration * 7)); // duration in weeks
        return endDate > now; // Reservation hasn't ended yet
      }
      return false;
    });
    
    if (activeReservations.length > 0) {
      const reservationDetails = activeReservations.map(app => {
        const startDate = app.startDate ? new Date(app.startDate).toLocaleDateString() : 'N/A';
        const endDate = new Date(app.startDate!);
        endDate.setDate(endDate.getDate() + (app.duration! * 7));
        return `${app.companyName} (${startDate} - ${endDate.toLocaleDateString()})`;
      }).join(', ');
      
      throw new ServiceError(
        "CONFLICT",
        `Cannot delete booth "${booth.label || boothId}". It has ${activeReservations.length} upcoming/active reservation(s): ${reservationDetails}`,
        409
      );
    }

    platform.booths.splice(boothIndex, 1);
    
    const updated = await this.repository.update(platform.id, {
      booths: platform.booths,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to remove booth", 500);
    }

    return updated;
  }

  /**
   * Set a platform as active
   */
  async setActivePlatform(id: string): Promise<IPlatformMap> {
    const result = await this.repository.setActive(id);
    if (!result) {
      throw new ServiceError("NOT_FOUND", "Platform map not found", 404);
    }
    return result;
  }

  /**
   * Check if a space is available (no overlapping booths)
   */
  private isSpaceAvailable(
    x: number,
    y: number,
    width: number,
    height: number,
    existingBooths: IBoothPlacement[]
  ): boolean {
    for (const booth of existingBooths) {
      // Check if rectangles overlap
      if (
        x < booth.x + booth.width &&
        x + width > booth.x &&
        y < booth.y + booth.height &&
        y + height > booth.y
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate that booth placements don't overlap
   */
  private validateBoothPlacements(
    booths: IBoothPlacement[],
    gridWidth: number,
    gridHeight: number
  ): void {
    for (let i = 0; i < booths.length; i++) {
      const booth = booths[i];
      
      // Check bounds
      if (
        booth.x < 0 ||
        booth.y < 0 ||
        booth.x + booth.width > gridWidth ||
        booth.y + booth.height > gridHeight
      ) {
        throw new ServiceError("BAD_REQUEST", `Booth ${booth.id} exceeds platform boundaries`, 400);
      }

      // Check overlap with other booths
      for (let j = i + 1; j < booths.length; j++) {
        const otherBooth = booths[j];
        if (
          booth.x < otherBooth.x + otherBooth.width &&
          booth.x + booth.width > otherBooth.x &&
          booth.y < otherBooth.y + otherBooth.height &&
          booth.y + booth.height > otherBooth.y
        ) {
          throw new ServiceError("BAD_REQUEST", `Booths ${booth.id} and ${otherBooth.id} overlap`, 400);
        }
      }
    }
  }
}

export const platformMapService = new PlatformMapService(platformMapRepository);
