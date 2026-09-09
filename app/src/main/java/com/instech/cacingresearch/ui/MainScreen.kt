package com.instech.cacingresearch.ui

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.instech.cacingresearch.data.DataManager
import com.instech.cacingresearch.data.Pengamatan
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val context = LocalContext.current
    val dataManager = remember { DataManager(context) }
    
    var selectedTab by remember { mutableStateOf(0) }
    var showAddDialog by remember { mutableStateOf(false) }
    var pengamatanList by remember { mutableStateOf(dataManager.getAllPengamatan()) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cacing Research") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true }
            ) {
                Icon(Icons.Default.Add, "Tambah Pengamatan")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Daftar Pengamatan") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Statistik") }
                )
            }
            
            when (selectedTab) {
                0 -> PengamatanListScreen(
                    pengamatanList = pengamatanList,
                    onDelete = { id ->
                        dataManager.deletePengamatan(id)
                        pengamatanList = dataManager.getAllPengamatan()
                    }
                )
                1 -> StatistikScreen(pengamatanList)
            }
        }
    }
    
    if (showAddDialog) {
        AddPengamatanDialog(
            onDismiss = { showAddDialog = false },
            onSave = { pengamatan ->
                dataManager.savePengamatan(pengamatan)
                pengamatanList = dataManager.getAllPengamatan()
                showAddDialog = false
            }
        )
    }
}

@Composable
fun PengamatanListScreen(
    pengamatanList: List<Pengamatan>,
    onDelete: (String) -> Unit
) {
    if (pengamatanList.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = androidx.compose.ui.Alignment.Center
        ) {
            Text("Belum ada data pengamatan", style = MaterialTheme.typography.bodyLarge)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(pengamatanList, key = { it.id }) { pengamatan ->
                PengamatanCard(pengamatan = pengamatan, onDelete = onDelete)
            }
        }
    }
}

@Composable
fun StatistikScreen(pengamatanList: List<Pengamatan>) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Total Pengamatan",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    "${pengamatanList.size}",
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
        
        val totalLimbah = pengamatanList.sumOf { 
            it.jumlahLimbah.toDoubleOrNull() ?: 0.0 
        }
        
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Total Limbah Masuk",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    "${String.format("%.2f", totalLimbah)} kg",
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
        
        val jenisCacingCount = pengamatanList
            .groupBy { it.jenisCacing }
            .mapValues { it.value.size }
        
        if (jenisCacingCount.isNotEmpty()) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Per Jenis Cacing",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    jenisCacingCount.forEach { (jenis, count) ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(jenis.ifEmpty { "Tidak disebutkan" })
                            Text("$count pengamatan")
                        }
                    }
                }
            }
        }
    }
}
