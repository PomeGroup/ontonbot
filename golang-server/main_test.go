package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestTokenMiddleware tests the tokenMiddleware function
func TestTokenMiddleware(t *testing.T) {
	req, err := http.NewRequest("GET", "/send", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer testtoken")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Test if the token is correctly passed through the middleware
		if got := r.Header.Get("Authorization"); got != "Bearer testtoken" {
			t.Errorf("tokenMiddleware() = %q, want %q", got, "Bearer testtoken")
		}
	})

	tokenMiddleware(handler).ServeHTTP(rr, req)
}

// TestSendHandler tests the sendHandler function
func TestSendHandler(t *testing.T) {
	roomHash := "room123"
	userID := "user456"
	url := "/send?room_hash=" + roomHash + "&user_id=" + userID

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(sendHandler)

	handler.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check the response body
	expected := "Data received: " + roomHash + ", " + userID
	if strings.TrimSpace(rr.Body.String()) != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}
}

// Test main or other functions as needed
