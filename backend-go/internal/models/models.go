package models

import "time"

// HealthResponse for API health probe
type HealthResponse struct {
	Status               string    `json:"status"`
	Engine               string    `json:"engine"`
	Timestamp            time.Time `json:"timestamp"`
	GolangMigrationReady bool      `json:"golangMigrationReady"`
}

// User model
type User struct {
	ID                string     `json:"id"`
	Name              string     `json:"name,omitempty"`
	Email             string     `json:"email"`
	PasswordHash      string     `json:"passwordHash,omitempty"`
	AvatarURL         string     `json:"avatarUrl,omitempty"`
	IsActive          bool       `json:"isActive"`
	ActivationToken   string     `json:"activationToken,omitempty"`
	ActivationExpires *time.Time `json:"activationExpires,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

// Role model (RBAC)
type Role struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"` // owner | admin | member | viewer
	Description string       `json:"description,omitempty"`
	IsSystem    bool         `json:"isSystem"`
	Permissions []Permission `json:"permissions,omitempty"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}

// Permission model (RBAC)
type Permission struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`   // e.g. invoice:create, invoice:read
	Module      string    `json:"module"` // invoice, customer, workspace, product
	Description string    `json:"description,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// RolePermission junction model (RBAC)
type RolePermission struct {
	RoleID       string `json:"roleId"`
	PermissionID string `json:"permissionId"`
}

// Workspace model (personal | company)
type Workspace struct {
	ID             string          `json:"id"`
	Type           string          `json:"type"` // personal | company
	Name           string          `json:"name"`
	Slug           string          `json:"slug"`
	OwnerID        string          `json:"ownerId"`
	Owner          *User           `json:"owner,omitempty"`
	CompanyProfile *CompanyProfile `json:"companyProfile,omitempty"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}

// CompanyProfile model (Multi-company profile)
type CompanyProfile struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	LegalName   string    `json:"legalName"`
	DisplayName string    `json:"displayName,omitempty"`
	Email       string    `json:"email,omitempty"`
	Phone       string    `json:"phone,omitempty"`
	Address     string    `json:"address,omitempty"`
	TaxNumber   string    `json:"taxNumber,omitempty"`
	LogoURL     string    `json:"logoUrl,omitempty"`
	Website     string    `json:"website,omitempty"`
	Currency    string    `json:"currency"`
	Timezone    string    `json:"timezone"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// WorkspaceMember model (RBAC attached via RoleID)
type WorkspaceMember struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	UserID      string    `json:"userId"`
	User        *User     `json:"user,omitempty"`
	RoleID      string    `json:"roleId"`
	Role        *Role     `json:"role,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// WorkspaceInvitation model
type WorkspaceInvitation struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspaceId"`
	Email       string     `json:"email"`
	RoleID      string     `json:"roleId"`
	Role        *Role      `json:"role,omitempty"`
	Token       string     `json:"token"`
	ExpiresAt   time.Time  `json:"expiresAt"`
	AcceptedAt  *time.Time `json:"acceptedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

// Customer model
type Customer struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId,omitempty"`
	Name        string    `json:"name"`
	Email       string    `json:"email,omitempty"`
	Company     string    `json:"company,omitempty"`
	Phone       string    `json:"phone,omitempty"`
	Address     string    `json:"address,omitempty"`
	TaxNumber   string    `json:"taxNumber,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Product model
type Product struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Price       float64   `json:"price"`
	Unit        string    `json:"unit"`
	TaxRate     float64   `json:"taxRate"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// PaymentMethod model
type PaymentMethod struct {
	ID            string    `json:"id"`
	WorkspaceID   string    `json:"workspaceId"`
	Name          string    `json:"name"`
	Type          string    `json:"type"` // bank_transfer, cash, qris, card, other
	BankName      string    `json:"bankName,omitempty"`
	AccountName   string    `json:"accountName,omitempty"`
	AccountNumber string    `json:"accountNumber,omitempty"`
	IsActive      bool      `json:"isActive"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// InvoiceTemplate model
type InvoiceTemplate struct {
	ID           string    `json:"id"`
	WorkspaceID  string    `json:"workspaceId"`
	Name         string    `json:"name"`
	TemplateType string    `json:"templateType"`
	Settings     string    `json:"settings,omitempty"`
	IsDefault    bool      `json:"isDefault"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Invoice model
type Invoice struct {
	ID            string           `json:"id"`
	WorkspaceID   string           `json:"workspaceId,omitempty"`
	CustomerID    string           `json:"customerId"`
	Customer      *Customer        `json:"customer,omitempty"`
	TemplateID    *string          `json:"templateId,omitempty"`
	Template      *InvoiceTemplate `json:"template,omitempty"`
	InvoiceNumber string           `json:"invoiceNumber"`
	IssueDate     time.Time        `json:"issueDate"`
	DueDate       *time.Time       `json:"dueDate,omitempty"`
	Status        string           `json:"status"` // draft | sent | unpaid | partially_paid | paid | overdue | cancelled
	Subtotal      float64          `json:"subtotal"`
	Discount      float64          `json:"discount"`
	TaxRate       float64          `json:"taxRate,omitempty"`
	Tax           float64          `json:"tax"`
	Total         float64          `json:"total"`
	TotalAmount   float64          `json:"totalAmount,omitempty"`
	AmountPaid    float64          `json:"amountPaid"`
	AmountDue     float64          `json:"amountDue"`
	Currency      string           `json:"currency,omitempty"`
	Notes         string           `json:"notes,omitempty"`
	Terms         string           `json:"terms,omitempty"`
	Items         []InvoiceItem    `json:"items"`
	Payments      []Payment        `json:"payments,omitempty"`
	CreatedAt     time.Time        `json:"createdAt"`
	UpdatedAt     time.Time        `json:"updatedAt"`
}

// InvoiceItem model
type InvoiceItem struct {
	ID          string    `json:"id"`
	InvoiceID   string    `json:"invoiceId"`
	ProductID   *string   `json:"productId,omitempty"`
	Description string    `json:"description"`
	Quantity    float64   `json:"quantity"`
	Unit        string    `json:"unit,omitempty"`
	UnitPrice   float64   `json:"unitPrice"`
	Discount    float64   `json:"discount"`
	TaxRate     float64   `json:"taxRate"`
	Subtotal    float64   `json:"subtotal"`
	Tax         float64   `json:"tax"`
	Total       float64   `json:"total"`
	Amount      float64   `json:"amount,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Payment model
type Payment struct {
	ID              string         `json:"id"`
	InvoiceID       string         `json:"invoiceId"`
	PaymentMethodID *string        `json:"paymentMethodId,omitempty"`
	PaymentMethod   *PaymentMethod `json:"paymentMethod,omitempty"`
	Amount          float64        `json:"amount"`
	PaymentDate     time.Time      `json:"paymentDate"`
	ReferenceNumber string         `json:"referenceNumber,omitempty"`
	Status          string         `json:"status"` // pending | completed | failed | refunded
	Notes           string         `json:"notes,omitempty"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}
