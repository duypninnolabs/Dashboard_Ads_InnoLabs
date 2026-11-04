package bussiness_manager

import (
	"context"
	"fmt"
	"strings"

	"dashboard--ads/internal/bm"
)

type BussinessManagerService interface {
	GetAllBusinessManagers() ([]BussinessManagerModel, error)
	GetBusinessManagerByID(ctx context.Context, id string) (*BussinessManagerModel, error)
	VerifyBusinessManager(ctx context.Context, req VerifyBusinessManagerRequest) (*VerifyBusinessManagerResponse, error)
	SaveBusinessManager(ctx context.Context, req SaveBusinessManagerRequest) error
	UpdateBusinessManager(ctx context.Context, id string, req SaveBusinessManagerRequest) error
	DeleteBusinessManager(ctx context.Context, id string) error
}

type businessManagerService struct {
	repository BussinessManagerRepository
}

func NewBusinessManagerService(repository BussinessManagerRepository) BussinessManagerService {
	return &businessManagerService{
		repository: repository,
	}
}

func (s *businessManagerService) GetAllBusinessManagers() ([]BussinessManagerModel, error) {
	return s.repository.GetAllBusinessManagers()
}

func (s *businessManagerService) VerifyBusinessManager(ctx context.Context, req VerifyBusinessManagerRequest) (*VerifyBusinessManagerResponse, error) {
	bmID := strings.TrimSpace(req.BMID)
	token := strings.TrimSpace(req.Token)

	if bmID == "" || token == "" {
		return &VerifyBusinessManagerResponse{
			Valid:   false,
			BMID:    bmID,
			Message: "BM ID và Access Token không được để trống",
		}, nil
	}

	apiVersion := "v22.0"
	metaBusiness, err := bm.FetchBusiness(ctx, apiVersion, bmID, token)
	if err != nil {
		return &VerifyBusinessManagerResponse{
			Valid:   false,
			BMID:    bmID,
			Message: fmt.Sprintf("Xác thực thất bại: %v", err),
		}, nil
	}

	return &VerifyBusinessManagerResponse{
		Valid:        true,
		BMID:         metaBusiness.ID,
		BusinessName: metaBusiness.Name,
		Message:      "Token hợp lệ và kết nối Meta thành công",
	}, nil
}

func (s *businessManagerService) SaveBusinessManager(ctx context.Context, req SaveBusinessManagerRequest) error {
	bmID := strings.TrimSpace(req.BMID)
	token := strings.TrimSpace(req.Token)

	if bmID == "" || token == "" {
		return fmt.Errorf("BM ID và Access Token không được để trống")
	}

	// Nếu chưa có business_name, tự động verify lấy tên thật từ Meta
	if strings.TrimSpace(req.BusinessName) == "" {
		apiVersion := "v22.0"
		metaBusiness, err := bm.FetchBusiness(ctx, apiVersion, bmID, token)
		if err == nil && metaBusiness != nil && metaBusiness.Name != "" {
			req.BusinessName = metaBusiness.Name
		} else {
			req.BusinessName = "BM " + bmID
		}
	}

	return s.repository.UpsertBusinessManager(ctx, req)
}

func (s *businessManagerService) GetBusinessManagerByID(ctx context.Context, id string) (*BussinessManagerModel, error) {
	return s.repository.GetBusinessManagerByID(ctx, id)
}

func (s *businessManagerService) UpdateBusinessManager(ctx context.Context, id string, req SaveBusinessManagerRequest) error {
	// Nếu người dùng nhập token mới nhưng không nhập tên, thử verify lấy tên mới
	if strings.TrimSpace(req.Token) != "" && strings.TrimSpace(req.BusinessName) == "" {
		apiVersion := "v22.0"
		metaBusiness, err := bm.FetchBusiness(ctx, apiVersion, req.BMID, req.Token)
		if err == nil && metaBusiness != nil && metaBusiness.Name != "" {
			req.BusinessName = metaBusiness.Name
		}
	}
	return s.repository.UpdateBusinessManager(ctx, id, req)
}

func (s *businessManagerService) DeleteBusinessManager(ctx context.Context, id string) error {
	return s.repository.DeleteBusinessManager(ctx, id)
}


