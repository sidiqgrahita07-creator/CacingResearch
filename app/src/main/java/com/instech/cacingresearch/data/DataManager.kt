package com.instech.cacingresearch.data

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File

class DataManager(private val context: Context) {
    private val gson = Gson()
    private val fileName = "pengamatan_data.json"
    
    fun savePengamatan(pengamatan: Pengamatan) {
        val list = getAllPengamatan().toMutableList()
        list.add(0, pengamatan) // Add to top
        saveList(list)
    }
    
    fun getAllPengamatan(): List<Pengamatan> {
        val file = File(context.filesDir, fileName)
        if (!file.exists()) return emptyList()
        
        return try {
            val json = file.readText()
            val type = object : TypeToken<List<Pengamatan>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    fun deletePengamatan(id: String) {
        val list = getAllPengamatan().filter { it.id != id }
        saveList(list)
    }
    
    private fun saveList(list: List<Pengamatan>) {
        val file = File(context.filesDir, fileName)
        file.writeText(gson.toJson(list))
    }
}
