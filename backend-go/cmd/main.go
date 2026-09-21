package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"invoice-generator-backend/internal/models"
)

// In-memory thread-safe storage for Golang learning demo
type Storage struct {
	mu        sync.RWMutex
	customers map[string]models.Customer
	invoices  map[string]models.Invoice
}

var store = &Storage{
	customers: make(map[string]models.Customer),
	invoices:  make(map[string]models.Invoice),
}

func initSeedData() {
	c1 := models.Customer{
		ID:        "cust-go-1",
		Name:      "Budi Santoso (Go API)",
		Email:     "budi@duluin.com",
		Company:   "Duluin Digital",
		Address:   "Jakarta, Indonesia",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	store.customers[c1.ID] = c1

	inv1 := models.Invoice{
		ID:            "inv-go-1001",
		InvoiceNumber: "INV-GO-2026-001",
		Status:        "PAID",
		IssueDate:     time.Now(),
		DueDate:       time.Now().AddDate(0, 0, 14),
		TaxRate:       11.0,
		Discount:      50.0,
		TotalAmount:   1160.0,
		Notes:         "Processed via Golang high-performance backend!",
		CustomerID:    c1.ID,
		Customer:      &c1,
		Items: []models.InvoiceItem{
			{
				ID:          "item-1",
				InvoiceID:   "inv-go-1001",
				Description: "Golang Microservice Development",
				Quantity:    1,
				UnitPrice:   1100.0,
				Amount:      1100.0,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	store.invoices[inv1.ID] = inv1
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		return
	}

	res := models.HealthResponse{
		Status:               "online",
		Engine:               "Golang Standard HTTP Server (Port 8080)",
		Timestamp:            time.Now(),
		GolangMigrationReady: true,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleCustomers(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		return
	}

	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		store.mu.RLock()
		defer store.mu.RUnlock()

		list := make([]models.Customer, 0, len(store.customers))
		for _, c := range store.customers {
			list = append(list, c)
		}
		json.NewEncoder(w).Encode(list)

	case http.MethodPost:
		var c models.Customer
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		store.mu.Lock()
		c.ID = fmt.Sprintf("cust-go-%d", time.Now().UnixNano())
		c.CreatedAt = time.Now()
		c.UpdatedAt = time.Now()
		store.customers[c.ID] = c
		store.mu.Unlock()

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(c)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleInvoices(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Check if URL is /api/v1/invoices or /api/v1/invoices/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/invoices")
	path = strings.TrimPrefix(path, "/")

	if path == "" {
		// List or Create Invoices
		switch r.Method {
		case http.MethodGet:
			store.mu.RLock()
			defer store.mu.RUnlock()

			list := make([]models.Invoice, 0, len(store.invoices))
			for _, inv := range store.invoices {
				list = append(list, inv)
			}
			json.NewEncoder(w).Encode(list)

		case http.MethodPost:
			var inv models.Invoice
			if err := json.NewDecoder(r.Body).Decode(&inv); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			store.mu.Lock()
			inv.ID = fmt.Sprintf("inv-go-%d", time.Now().UnixNano())
			inv.CreatedAt = time.Now()
			inv.UpdatedAt = time.Now()

			// Calculate totals
			var subtotal float64
			for i := range inv.Items {
				inv.Items[i].ID = fmt.Sprintf("item-%d", i+1)
				inv.Items[i].InvoiceID = inv.ID
				inv.Items[i].Amount = float64(inv.Items[i].Quantity) * inv.Items[i].UnitPrice
				subtotal += inv.Items[i].Amount
			}
			tax := (subtotal * inv.TaxRate) / 100.0
			inv.TotalAmount = subtotal + tax - inv.Discount

			// Link customer
			if cust, exists := store.customers[inv.CustomerID]; exists {
				inv.Customer = &cust
			}

			store.invoices[inv.ID] = inv
			store.mu.Unlock()

			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(inv)

		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	// Single Invoice ID operations
	invoiceID := path
	switch r.Method {
	case http.MethodGet:
		store.mu.RLock()
		inv, exists := store.invoices[invoiceID]
		store.mu.RUnlock()

		if !exists {
			http.Error(w, "Invoice not found", http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(inv)

	case http.MethodPatch:
		var req struct {
			Status string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		store.mu.Lock()
		inv, exists := store.invoices[invoiceID]
		if !exists {
			store.mu.Unlock()
			http.Error(w, "Invoice not found", http.StatusNotFound)
			return
		}
		inv.Status = req.Status
		inv.UpdatedAt = time.Now()
		store.invoices[invoiceID] = inv
		store.mu.Unlock()

		json.NewEncoder(w).Encode(inv)

	case http.MethodDelete:
		store.mu.Lock()
		delete(store.invoices, invoiceID)
		store.mu.Unlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Invoice deleted from Golang backend",
		})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func main() {
	initSeedData()

	http.HandleFunc("/api/v1/health", handleHealth)
	http.HandleFunc("/api/v1/customers", handleCustomers)
	http.HandleFunc("/api/v1/invoices", handleInvoices)
	http.HandleFunc("/api/v1/invoices/", handleInvoices)

	port := ":8080"
	fmt.Printf("🚀 Golang Billing & Invoice API running on http://localhost%s\n", port)
	fmt.Printf("💡 Ready to take over Next.js API traffic via NEXT_PUBLIC_API_BASE_URL!\n")
	log.Fatal(http.ListenAndServe(port, nil))
}
