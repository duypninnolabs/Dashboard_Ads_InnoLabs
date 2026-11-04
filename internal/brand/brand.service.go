package brand

import "context"

type BrandService interface {
	GetAllBrands(ctx context.Context) ([]BrandModel, error)
	GetBrandByID(ctx context.Context, id int64) (*BrandModel, error)
	CreateBrand(ctx context.Context, name string) (*BrandModel, error)
	DeleteBrand(ctx context.Context, id int64) error
}

type brandService struct {
	repository BrandRepository
}

func NewBrandService(repository BrandRepository) BrandService {
	return &brandService{
		repository: repository,
	}
}

func (s *brandService) GetAllBrands(ctx context.Context) ([]BrandModel, error) {
	return s.repository.GetAllBrands(ctx)
}

func (s *brandService) GetBrandByID(ctx context.Context, id int64) (*BrandModel, error) {
	return s.repository.GetBrandByID(ctx, id)
}

func (s *brandService) CreateBrand(ctx context.Context, name string) (*BrandModel, error) {
	return s.repository.CreateBrand(ctx, name)
}

func (s *brandService) DeleteBrand(ctx context.Context, id int64) error {
	return s.repository.DeleteBrand(ctx, id)
}
