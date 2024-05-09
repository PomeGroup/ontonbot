// server.go
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
	"github.com/tonft-app/highload-wallet-server/highload"
)

var (
	flagRedisAddr = flag.String("redis-addr", "redis:6379", "Redis server address")
)

func handleDistributionTask(ctx context.Context, task *asynq.Task) error {
	log.Printf("Handler received task %s\n", task.Payload())

	var payload struct {
		Receivers  map[string]string `json:"receivers"`
		SeedPhrase string            `json:"seed_phrase"`
		Mode       int64             `json:"mode"`
	}

	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("error unmarshalling task payload: %w", err)
	}

	err := highload.SendTransactions(payload.SeedPhrase, "TON Society Event Reward", payload.Receivers, payload.Mode)

	if err != nil {
		return fmt.Errorf("error sending transactions: %w", err)
	}

	log.Println("Transactions sent")

	return nil
}

func main() {
	flag.Parse()

	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: *flagRedisAddr},
		asynq.Config{
			Queues:      map[string]int{"highload-sender-queue": 1},
			Concurrency: 1,
		},
	)

	mux := asynq.NewServeMux()
	mux.HandleFunc("distribution-task", handleDistributionTask)

	if err := srv.Run(mux); err != nil {
		log.Fatalf("Failed to start the server: %v", err)
	}
}
