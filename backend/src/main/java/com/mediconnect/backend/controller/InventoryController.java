package com.mediconnect.backend.controller;

import com.mediconnect.backend.model.InventoryItem;
import com.mediconnect.backend.repository.InventoryItemRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryItemRepository inventoryItemRepository;

    public InventoryController(InventoryItemRepository inventoryItemRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @GetMapping
    public List<InventoryItem> all() {
        return inventoryItemRepository.findAll();
    }

    @GetMapping("/low-stock")
    public List<InventoryItem> lowStock() {
        return inventoryItemRepository.findAll().stream()
                .filter(i -> i.getStock() <= i.getMinStock())
                .toList();
    }

    @PostMapping
    public InventoryItem create(@RequestBody InventoryItem item) {
        item.setId(null);
        return inventoryItemRepository.save(item);
    }

    @PutMapping("/{id}")
    public InventoryItem update(@PathVariable Long id, @RequestBody InventoryItem payload) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found"));
        item.setName(payload.getName());
        item.setCategory(payload.getCategory());
        item.setStock(payload.getStock());
        item.setMinStock(payload.getMinStock());
        item.setPrice(payload.getPrice());
        item.setUnit(payload.getUnit());
        item.setSupplier(payload.getSupplier());
        item.setExpiryDate(payload.getExpiryDate());
        return inventoryItemRepository.save(item);
    }
}
