package com.instech.cacingresearch.data

import android.util.Log
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

class SheetsSync {
    private val gson = Gson()
    
    suspend fun syncPengamatan(pengamatan: Pengamatan): Result<String> {
        if (!SheetsConfig.SYNC_ENABLED) {
            return Result.success("Sync disabled")
        }
        
        if (SheetsConfig.SHEETS_API_URL.contains("PASTE_URL")) {
            Log.w("SheetsSync", "Sheets API URL belum dikonfigurasi")
            return Result.success("Sheets URL not configured")
        }
        
        return withContext(Dispatchers.IO) {
            try {
                val url = URL(SheetsConfig.SHEETS_API_URL)
                val connection = url.openConnection() as HttpURLConnection
                
                connection.requestMethod = "POST"
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                
                // Send JSON
                val jsonData = gson.toJson(pengamatan)
                connection.outputStream.use { it.write(jsonData.toByteArray()) }
                
                // Read response
                val responseCode = connection.responseCode
                val response = if (responseCode == 200 || responseCode == 302) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    connection.errorStream?.bufferedReader()?.use { it.readText() } ?: "Error $responseCode"
                }
                
                connection.disconnect()
                
                if (responseCode == 200 || responseCode == 302) {
                    Log.d("SheetsSync", "Success: $response")
                    Result.success(response)
                } else {
                    Log.e("SheetsSync", "Failed: $responseCode - $response")
                    Result.failure(Exception("HTTP $responseCode: $response"))
                }
                
            } catch (e: Exception) {
                Log.e("SheetsSync", "Sync error", e)
                Result.failure(e)
            }
        }
    }
}
