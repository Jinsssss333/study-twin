import { mutation } from "./_generated/server";

export const addTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // This is a simple test data script
    // In a real app, you'd want more sophisticated test data
    
    console.log("Test data script executed - add your test data here");
    
    return { message: "Test data script completed" };
  },
});
