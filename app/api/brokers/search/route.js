// app/api/brokers/search/route.js
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 8889,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "diamond",
};

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 1) {
        return NextResponse.json([]);
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Search brokers by name (case-insensitive)
        const [rows] = await connection.execute(
            `SELECT id, name, phone, email 
       FROM brokers 
       WHERE name LIKE ? 
       ORDER BY name ASC 
       LIMIT 10`,
            [`%${query}%`]
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error searching brokers:", error);
        return NextResponse.json(
            { error: "Failed to search brokers" },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}