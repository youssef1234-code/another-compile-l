import {
  eventsOfficeProcedure,
  protectedProcedure,
  router,
} from "../trpc/trpc";
import { platformMapService } from "../services/platform-map.service";
import { z } from "zod";
import mongoose from "mongoose";

const BoothPlacementInputSchema = z.object({
  id: z.string(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(2).max(4),
  height: z.number().int().min(2).max(4),
  isOccupied: z.boolean(),
  applicationId: z.string().optional(),
  label: z.string().optional(),
  isVIP: z.boolean().optional(),
});

const LandmarkInputSchema = z.object({
  id: z.string(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  type: z.enum(['ENTRANCE', 'EXIT', 'SPECIAL_PLACE']),
  label: z.string().min(1).max(100),
  rotation: z.number().int().optional().refine((val) => val === undefined || [0, 90, 180, 270].includes(val), {
    message: "Rotation must be 0, 90, 180, or 270 degrees"
  }),
});

const CustomTextInputSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string().min(1).max(500),
  fontSize: z.number().int().min(8).max(72).default(16),
});

const CustomObjectInputSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  type: z.enum(['circle', 'square']),
  size: z.number().int().min(20).max(200).default(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"),
});

const CreatePlatformMapSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gridWidth: z.number().int().min(10).max(100),
  gridHeight: z.number().int().min(10).max(100),
  cellSize: z.number().int().min(20).max(100).default(40),
  booths: z.array(BoothPlacementInputSchema).default([]),
  landmarks: z.array(LandmarkInputSchema).optional(),
  customTexts: z.array(CustomTextInputSchema).optional(),
  customObjects: z.array(CustomObjectInputSchema).optional(),
  isActive: z.boolean().default(false),
});

const UpdatePlatformMapSchema = z.object({
  name: z.string().min(1).optional(),
  gridWidth: z.number().int().min(10).max(100).optional(),
  gridHeight: z.number().int().min(10).max(100).optional(),
  booths: z.array(BoothPlacementInputSchema).optional(),
  landmarks: z.array(LandmarkInputSchema).optional(),
  customTexts: z.array(CustomTextInputSchema).optional(),
  customObjects: z.array(CustomObjectInputSchema).optional(),
});

const AddBoothSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(2).max(4),
  height: z.number().int().min(2).max(4),
  isOccupied: z.boolean().default(false),
  applicationId: z.string().optional(),
  label: z.string().optional(),
});

export const platformMapRouter = router({
  /**
   * Get the active platform map (available to all authenticated users)
   */
  getActivePlatform: protectedProcedure.query(async () => {
    return await platformMapService.getActivePlatformMap();
  }),

  /**
   * Get all platform maps (admin/event office only)
   */
  getAllPlatforms: eventsOfficeProcedure.query(async () => {
    return await platformMapService.findAll();
  }),

  /**
   * Create a new platform map (admin/event office only)
   */
  createPlatform: eventsOfficeProcedure
    .input(CreatePlatformMapSchema)
    .mutation(async ({ input }) => {
      // Convert string applicationIds to ObjectIds
      const booths = input.booths.map((booth) => ({
        ...booth,
        applicationId: booth.applicationId
          ? new mongoose.Types.ObjectId(booth.applicationId)
          : undefined,
      }));
      
      return await platformMapService.create({
        ...input,
        booths,
      } as any);
    }),

  /**
   * Update platform map (admin/event office only)
   */
  updatePlatform: eventsOfficeProcedure
    .input(
      z.object({
        id: z.string(),
        data: UpdatePlatformMapSchema,
      })
    )
    .mutation(async ({ input }) => {
      // Convert string applicationIds to ObjectIds if booths provided
      const data = input.data.booths
        ? {
            ...input.data,
            booths: input.data.booths.map((booth) => ({
              ...booth,
              applicationId: booth.applicationId
                ? new mongoose.Types.ObjectId(booth.applicationId)
                : undefined,
            })),
          }
        : input.data;
      
      return await platformMapService.updatePlatformMap(input.id, data as any);
    }),

  /**
   * Set a platform as active (admin/event office only)
   */
  setActivePlatform: eventsOfficeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const updated = await platformMapService.findById(input.id);
      if (!updated) {
        throw new Error("Platform map not found");
      }
      // Use the repository method through a public service method
      const result = await platformMapService.setActivePlatform(input.id);
      return result;
    }),

  /**
   * Get available locations for a booth size
   */
  getAvailableLocations: protectedProcedure
    .input(
      z.object({
        width: z.number().int().min(2).max(4),
        height: z.number().int().min(2).max(4),
      })
    )
    .query(async ({ input }) => {
      return await platformMapService.getAvailableLocations(
        input.width,
        input.height
      );
    }),

  /**
   * Add a booth to the platform
   */
  addBooth: eventsOfficeProcedure
    .input(AddBoothSchema)
    .mutation(async ({ input }) => {
      const boothData = {
        ...input,
        applicationId: input.applicationId
          ? new mongoose.Types.ObjectId(input.applicationId)
          : undefined,
      };
      return await platformMapService.addBooth(boothData as any);
    }),

  /**
   * Remove a booth from the platform
   */
  removeBooth: eventsOfficeProcedure
    .input(z.object({ boothId: z.string() }))
    .mutation(async ({ input }) => {
      return await platformMapService.removeBooth(input.boothId);
    }),
});
