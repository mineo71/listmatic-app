import { GoogleGenAI } from "@google/genai";

// Types for our structure
import type { HoneycombItem } from "../components/honeycomb/canvas/HoneycombTypes";

export async function generateHoneycombWithAI(prompt: string): Promise<HoneycombItem[]> {
  try {
    // Initialize the Google GenAI client
    const apiKey = import.meta.env.VITE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not found. Please add VITE_AI_API_KEY to your .env file");
    }

    const genAI = new GoogleGenAI({ apiKey });

    // Prepare a well-structured prompt
    const fullPrompt = `
      Generate a honeycomb structure for a task planning app based on this description:
      "${prompt}"
      
      The structure should be a valid JSON array where each item represents a task node with the following properties:
      - id: string - unique identifier
      - q, r: number - axial coordinates for hexagon grid positioning
      - x, y: number - calculated pixel positions (will be recalculated)
      - title: string - short title of the task (max 15 chars)
      - description: string - longer description
      - icon: string - one of: Target, Boxes, Plus, Briefcase, MessageCircle, Settings, Star, Flag, AlertCircle, Archive, Bell, Bookmark, CheckCircle, Code, FileText, Heart, Home, Mail, Timer, Trophy, Truck, Tv, Upload, User, Users, Video, Wallet, Watch, Zap, Bug, Building, Camera, Car, BarChart, PieChart, Cloud, Coffee
      - priority: string - "low", "medium", or "high"
      - completed: boolean - always false initially
      - connections: string[] - array of IDs this node connects to
      - color: string - hex color code
      - isMain: boolean - true only for the main/central node

      The first item should have id "main" and be the central node (q:0, r:0) with isMain:true.
      A well-structured honeycomb should have logical connections between nodes.
      Include 5-15 nodes total.

      Only respond with the valid JSON array, nothing else.
    `;

    // Make the API call
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
    });
    
    // Clean up the response - remove any markdown code blocks or extra text
    const jsonString = result.text?.replace(/```json|```/g, '').trim() ?? '';
    
    // Parse the JSON
    const parsedItems = JSON.parse(jsonString) as HoneycombItem[];
    
    // Process and validate the items
    const processedItems = processHoneycombItems(parsedItems);
    
    return processedItems;
  } catch (error) {
    console.error("Error generating honeycomb:", error);
    throw new Error("Failed to generate honeycomb structure with AI");
  }
}

// Helper function to process and validate the generated items
function processHoneycombItems(items: HoneycombItem[]): HoneycombItem[] {
  // Ensure all items have required properties
  return items.map((item, index) => {
    // Make sure the main item is properly set
    if (index === 0 && !item.isMain) {
      item.isMain = true;
      item.q = 0;
      item.r = 0;
    }
    
    // Calculate pixel positions based on q,r coordinates
    const x = item.q * 90; // Using simple calculation for demo
    const y = (item.r * 52) + (item.q * 26); // Approximate hexagon geometry
    
    // Ensure connections exist
    if (!item.connections) {
      item.connections = [];
    }
    
    // Set timestamps
    const now = new Date();
    
    return {
      ...item,
      x,
      y,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
  });
}