/**
 * Test Database Schema
 * 
 * This utility helps test the actual database schema
 * to determine correct field names
 */

import { supabase } from "../services/supabase";

export async function testDatabaseSchema() {
  console.log("=== Testing Database Schema ===");
  
  // Test 1: Try with retail_price / wholesale_price
  console.log("\n1. Testing with retail_price / wholesale_price...");
  try {
    const testData1 = {
      name: "TEST_SCHEMA_1",
      sku: `TEST-${Date.now()}-1`,
      category: "Test",
      retail_price: 10000,
      wholesale_price: 9000,
      stock: 100,
    };
    
    const { data: result1, error: error1 } = await supabase
      .from("products")
      .insert([testData1])
      .select();
    
    if (error1) {
      console.error("❌ retail_price / wholesale_price failed:", error1);
      console.error("Error details:", {
        message: error1.message,
        hint: error1.hint,
        details: error1.details,
        code: error1.code,
      });
    } else {
      console.log("✅ retail_price / wholesale_price SUCCESS!");
      console.log("Result:", result1);
      
      // Clean up
      if (result1 && result1[0]) {
        await supabase.from("products").delete().eq("id", result1[0].id);
        console.log("✅ Test record deleted");
      }
      
      return "retail_price";
    }
  } catch (err) {
    console.error("❌ Exception:", err);
  }
  
  // Test 2: Try with price_retail / price_wholesale
  console.log("\n2. Testing with price_retail / price_wholesale...");
  try {
    const testData2 = {
      name: "TEST_SCHEMA_2",
      sku: `TEST-${Date.now()}-2`,
      category: "Test",
      price_retail: 10000,
      price_wholesale: 9000,
      stock: 100,
    };
    
    const { data: result2, error: error2 } = await supabase
      .from("products")
      .insert([testData2])
      .select();
    
    if (error2) {
      console.error("❌ price_retail / price_wholesale failed:", error2);
      console.error("Error details:", {
        message: error2.message,
        hint: error2.hint,
        details: error2.details,
        code: error2.code,
      });
    } else {
      console.log("✅ price_retail / price_wholesale SUCCESS!");
      console.log("Result:", result2);
      
      // Clean up
      if (result2 && result2[0]) {
        await supabase.from("products").delete().eq("id", result2[0].id);
        console.log("✅ Test record deleted");
      }
      
      return "price_retail";
    }
  } catch (err) {
    console.error("❌ Exception:", err);
  }
  
  console.log("\n=== Schema Test Complete ===");
  return null;
}

/**
 * Get actual database columns
 */
export async function getDatabaseColumns() {
  console.log("=== Getting Database Columns ===");
  
  try {
    // Try to get one product to see the structure
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .limit(1);
    
    if (error) {
      console.error("❌ Failed to get products:", error);
      return null;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log("✅ Database columns found:", columns);
      return columns;
    } else {
      console.log("⚠️ No products in database to check schema");
      return null;
    }
  } catch (err) {
    console.error("❌ Exception:", err);
    return null;
  }
}
