package response

const (
	StatusSuccess  = 0
	StatusError    = 1
	StatusInvalid  = 2
	StatusNotFound = 3
)

var StatusText = map[int]string{
	StatusSuccess:  "success",
	StatusError:    "error",
	StatusInvalid:  "invalid_data",
	StatusNotFound: "not_found",
}
