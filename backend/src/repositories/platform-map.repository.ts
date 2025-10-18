import { PlatformMap, type IPlatformMap } from "../models/platform-map.model";
import { BaseRepository } from "./base.repository";

/**
 * Repository Pattern for Platform Map entity
 * Handles all database operations for platform booth layouts
 */
export class PlatformMapRepository extends BaseRepository<IPlatformMap> {
  constructor() {
    super(PlatformMap);
  }

  /**
   * Get the active platform map
   */
  async getActive(): Promise<IPlatformMap | null> {
    return this.model.findOne({ isActive: true });
  }

  /**
   * Set a platform map as active (deactivates all others)
   */
  async setActive(id: string): Promise<IPlatformMap | null> {
    // Deactivate all platform maps
    await this.model.updateMany({}, { isActive: false });
    
    // Activate the specified one
    return this.model.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
  }
}

export const platformMapRepository = new PlatformMapRepository();
