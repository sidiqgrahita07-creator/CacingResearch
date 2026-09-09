package com.instech.cacingresearch.data

import com.google.gson.annotations.SerializedName

data class Pengamatan(
    @SerializedName("id")
    val id: String = "",
    
    @SerializedName("tanggal")
    val tanggal: Long = System.currentTimeMillis(),
    
    @SerializedName("jenis_cacing")
    val jenisCacing: String = "",
    
    @SerializedName("jumlah_bibit")
    val jumlahBibit: String = "",
    
    @SerializedName("kascing")
    val kascing: String = "",
    
    @SerializedName("pretreatment")
    val pretreatment: String = "",
    
    @SerializedName("jumlah_limbah")
    val jumlahLimbah: String = "",
    
    @SerializedName("foto_paths")
    val fotoPaths: List<String> = emptyList(),
    
    @SerializedName("catatan")
    val catatan: String = ""
)
