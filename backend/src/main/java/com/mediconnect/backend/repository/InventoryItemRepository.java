package com.mediconnect.backend.repository;

import com.mediconnect.backend.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByStockLessThanEqual(Integer stock);
}
