package com.instech.cacingresearch.ui

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import coil.compose.rememberAsyncImagePainter
import com.instech.cacingresearch.data.Pengamatan
import com.instech.cacingresearch.utils.Utils
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPengamatanDialog(
    onDismiss: () -> Unit,
    onSave: (Pengamatan) -> Unit
) {
    val context = LocalContext.current
    
    var jenisCacing by remember { mutableStateOf("") }
    var jumlahBibit by remember { mutableStateOf("") }
    var kascing by remember { mutableStateOf("") }
    var pretreatment by remember { mutableStateOf("") }
    var jumlahLimbah by remember { mutableStateOf("") }
    var catatan by remember { mutableStateOf("") }
    var fotoPaths by remember { mutableStateOf<List<String>>(emptyList()) }
    
    var showPhotoOptions by remember { mutableStateOf(false) }
    var tempPhotoUri by remember { mutableStateOf<Uri?>(null) }
    
    // Camera launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && tempPhotoUri != null) {
            fotoPaths = fotoPaths + tempPhotoUri.toString()
        }
    }
    
    // Gallery launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            // Copy to app directory
            val fileName = "photo_${System.currentTimeMillis()}.jpg"
            val destFile = File(context.filesDir, fileName)
            context.contentResolver.openInputStream(uri)?.use { input ->
                destFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            fotoPaths = fotoPaths + destFile.absolutePath
        }
    }
    
    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            launchCamera(context) { uri ->
                tempPhotoUri = uri
                cameraLauncher.launch(uri)
            }
        }
    }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
            ) {
                // Title bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Tambah Pengamatan Baru",
                        style = MaterialTheme.typography.titleLarge
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, "Tutup")
                    }
                }
                
                Divider()
                
                // Form content
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = jenisCacing,
                        onValueChange = { jenisCacing = it },
                        label = { Text("Jenis Cacing") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Contoh: BSF, ANC") }
                    )
                    
                    OutlinedTextField(
                        value = jumlahBibit,
                        onValueChange = { jumlahBibit = it },
                        label = { Text("Jumlah Bibit") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Contoh: 1000 ekor") }
                    )
                    
                    OutlinedTextField(
                        value = kascing,
                        onValueChange = { kascing = it },
                        label = { Text("Kascing (kg)") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Contoh: 5.5") }
                    )
                    
                    OutlinedTextField(
                        value = pretreatment,
                        onValueChange = { pretreatment = it },
                        label = { Text("Pretreatment Pakan") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Contoh: Fermentasi 3 hari") }
                    )
                    
                    OutlinedTextField(
                        value = jumlahLimbah,
                        onValueChange = { jumlahLimbah = it },
                        label = { Text("Jumlah Limbah Masuk (kg)") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Contoh: 10.5") }
                    )
                    
                    OutlinedTextField(
                        value = catatan,
                        onValueChange = { catatan = it },
                        label = { Text("Catatan") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        placeholder = { Text("Catatan pengamatan harian...") }
                    )
                    
                    // Photo section
                    Text(
                        "Foto Dokumentasi",
                        style = MaterialTheme.typography.titleSmall
                    )
                    
                    if (fotoPaths.isNotEmpty()) {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(fotoPaths) { path ->
                                PhotoItem(
                                    path = path,
                                    onRemove = {
                                        fotoPaths = fotoPaths.filter { it != path }
                                    }
                                )
                            }
                        }
                    }
                    
                    OutlinedButton(
                        onClick = { showPhotoOptions = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, "Tambah Foto")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Tambah Foto")
                    }
                }
                
                Divider()
                
                // Action buttons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Batal")
                    }
                    
                    Button(
                        onClick = {
                            val pengamatan = Pengamatan(
                                id = Utils.generateId(),
                                tanggal = System.currentTimeMillis(),
                                jenisCacing = jenisCacing,
                                jumlahBibit = jumlahBibit,
                                kascing = kascing,
                                pretreatment = pretreatment,
                                jumlahLimbah = jumlahLimbah,
                                fotoPaths = fotoPaths,
                                catatan = catatan
                            )
                            onSave(pengamatan)
                        },
                        modifier = Modifier.weight(1f),
                        enabled = jumlahBibit.isNotEmpty() || kascing.isNotEmpty() || jumlahLimbah.isNotEmpty()
                    ) {
                        Text("Simpan")
                    }
                }
            }
        }
    }
    
    if (showPhotoOptions) {
        AlertDialog(
            onDismissRequest = { showPhotoOptions = false },
            title = { Text("Pilih Sumber Foto") },
            text = {
                Column {
                    TextButton(
                        onClick = {
                            showPhotoOptions = false
                            when (PackageManager.PERMISSION_GRANTED) {
                                ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) -> {
                                    launchCamera(context) { uri ->
                                        tempPhotoUri = uri
                                        cameraLauncher.launch(uri)
                                    }
                                }
                                else -> permissionLauncher.launch(Manifest.permission.CAMERA)
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("📷 Ambil Foto")
                    }
                    
                    TextButton(
                        onClick = {
                            showPhotoOptions = false
                            galleryLauncher.launch("image/*")
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("🖼️ Pilih dari Galeri")
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showPhotoOptions = false }) {
                    Text("Batal")
                }
            }
        )
    }
}

@Composable
fun PhotoItem(path: String, onRemove: () -> Unit) {
    Box(
        modifier = Modifier.size(100.dp)
    ) {
        val uri = if (path.startsWith("content://")) {
            Uri.parse(path)
        } else {
            Uri.fromFile(File(path))
        }
        
        Image(
            painter = rememberAsyncImagePainter(uri),
            contentDescription = "Foto",
            modifier = Modifier.size(100.dp),
            contentScale = ContentScale.Crop
        )
        
        IconButton(
            onClick = onRemove,
            modifier = Modifier.align(Alignment.TopEnd)
        ) {
            Surface(
                shape = RoundedCornerShape(50),
                color = MaterialTheme.colorScheme.error
            ) {
                Icon(
                    Icons.Default.Close,
                    "Hapus",
                    tint = MaterialTheme.colorScheme.onError,
                    modifier = Modifier
                        .size(24.dp)
                        .padding(4.dp)
                )
            }
        }
    }
}

private fun launchCamera(context: Context, onUriCreated: (Uri) -> Unit) {
    val photoFile = File(
        context.filesDir,
        "photo_${System.currentTimeMillis()}.jpg"
    )
    val uri = FileProvider.getUriForFile(
        context,
        "${context.packageName}.fileprovider",
        photoFile
    )
    onUriCreated(uri)
}
