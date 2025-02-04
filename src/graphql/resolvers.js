import { prisma } from "@/lib/prisma";

export const resolvers = {
  Query: {
    reports: async (_, __, context) => {
      if (!context.user.sub) {
        throw new Error("Not authenticated");
      }
      try {
        return await prisma.report.findMany({
          include: { injuries: true },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("Authentication error:", {
          error: error.message,
          stack: error.stack,
          path: "reports resolver",
        });
        throw new Error(`Authentication failed: ${error.message}`);
      }
    },
    report: async (_, { id }, context ) => {
      if (!context.user.sub) {
        throw new Error("Not authenticated");
      }
      try {
        return await prisma.report.findUnique({
          where: { id },
          include: { injuries: true },
        });
      } catch (error) {
        console.error("Authentication error:", {
          error: error.message,
          stack: error.stack,
          path: "report resolver",
        });
        throw new Error(`Authentication failed: ${error.message}`);
      }
    },
    analytics: async (_, __, context) => {
      if (!context.user.sub) {
        throw new Error("Not authenticated");
      }
      try {
        // Get all reports
        const reports = await prisma.report.findMany({
          include: { injuries: true },
        });

        // Get all injuries
        const injuries = reports.flatMap(report => report.injuries);

        // Calculate body part distribution
        const bodyPartCounts = injuries.reduce((acc, injury) => {
          acc[injury.bodyPart] = (acc[injury.bodyPart] || 0) + 1;
          return acc;
        }, {});

        const totalInjuries = injuries.length;
        const bodyPartDistribution = Object.entries(bodyPartCounts).map(([bodyPart, count]) => ({
          bodyPart,
          count,
          percentage: (count / totalInjuries) * 100
        }));

        // Calculate monthly reports
        const monthlyReports = reports.reduce((acc, report) => {
          const month = new Date(report.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        return {
          totalReports: reports.length,
          totalInjuries,
          bodyPartDistribution,
          monthlyReports: Object.entries(monthlyReports).map(([month, count]) => ({
            month,
            count
          }))
        };
      } catch (error) {
        console.error("Error in analytics:", error);
        throw error;
      }
    },
  },
  Mutation: {
    // sends a report to the server
    createReport: async (_, { input }, context) => {
      console.log("createReport input:", input);
      
      // Validate input
      if (!input || !input.reporterName || !input.injuryDateTime || !Array.isArray(input.injuries)) {
        console.error("Invalid input format:", input);
        return {
          success: false,
          message: "Invalid input format"
        };
      }
    
      if (!context.user?.sub) {
        return {
          success: false,
          message: "Not authenticated"
        };
      }
    
      try {
        const userId = context.user.sub.split("|")[1];
        
        // Validate injuries
        const validInjuries = input.injuries.filter(injury => 
          injury && injury.location && injury.bodyPart && injury.bodyPart !== 'unknown'
        );
    
        if (validInjuries.length === 0) {
          return {
            success: false,
            message: "At least one valid injury with known body part is required"
          };
        }
    
        const report = await prisma.report.create({
          data: {
            userId,
            reporterName: input.reporterName,
            injuryDateTime: new Date(input.injuryDateTime),
            status: "Open",
            injuries: {
              create: validInjuries.map((injury) => ({
                location: injury.location,
                bodyPart: injury.bodyPart
              })),
            },
          },
          include: {
            injuries: true,
          },
        });
    
        console.log("Report created successfully:", report);
    
        return {
          success: true,
          message: "Report created successfully"
        };
      } catch (error) {
        console.error("Error in createReport:", {
          error: error.message,
          stack: error.stack,
          input
        });
        
        return {
          success: false,
          message: error.message || "An error occurred while creating the report"
        };
      }
    },
    updateReport: async (_, { id, input }, context) => {
      if (!context.user.sub) {
        throw new Error("Not authenticated");
      }
      try {
        const report = await prisma.report.update({
          where: { id },
          data: {
            reporterName: input.reporterName,
            injuryDateTime: new Date(input.injuryDateTime),
            injuries: {
              deleteMany: {},
              create: input.injuries.map((injury) => ({
                location: injury.location,
                bodyPart: injury.bodyPart
              })),
            },
          },
          include: {
            injuries: true,
          },
        });
        return { success: true, message: "Report updated successfully", report };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },

    deleteReport: async (_, { id }, context) => {
      if (!context.user.sub) {
        throw new Error("Not authenticated");
      }
      try {
        await prisma.report.delete({
          where: { id },
        });
        return { success: true, message: "Report deleted successfully" };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },
  },
};
