package database

import (
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/clipture/internal/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type Database struct {
	Client   *mongo.Client
	Database *mongo.Database
}

// NewDatabase creates a new MongoDB connection
func NewDatabase(cfg *config.Config) (*Database, error) {
	// Build MongoDB URI
	var uri string
	if cfg.Database.URI != "" {
		uri = cfg.Database.URI
	} else {
		if cfg.Database.User != "" && cfg.Database.Password != "" {
			uri = fmt.Sprintf("mongodb://%s:%s@%s:%s",
				cfg.Database.User,
				cfg.Database.Password,
				cfg.Database.Host,
				cfg.Database.Port,
			)
		} else {
			uri = fmt.Sprintf("mongodb://%s:%s",
				cfg.Database.Host,
				cfg.Database.Port,
			)
		}
	}

	// Configure client options
	clientOptions := options.Client().ApplyURI(uri).
		SetMaxPoolSize(100).
		SetMaxConnIdleTime(30 * time.Minute).
		SetTimeout(10 * time.Second)

	// Configure retry logic
	var client *mongo.Client
	var err error
	var retryCount int
	maxRetries := 5
	retryDelay := 2 * time.Second

	for retryCount < maxRetries {
		// Create context with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

		// Connect to MongoDB
		client, err = mongo.Connect(ctx, clientOptions)
		if err == nil {
			// Test connection
			err = client.Ping(ctx, readpref.Primary())
			if err == nil {
				cancel()
				break
			}
		}
		cancel()

		retryCount++
		log.Warn().
			Err(err).
			Int("retry", retryCount).
			Int("maxRetries", maxRetries).
			Msg("Failed to connect to MongoDB, retrying...")

		if retryCount < maxRetries {
			time.Sleep(retryDelay)
			// Exponential backoff
			retryDelay *= 2
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB after %d attempts: %w", maxRetries, err)
	}

	// Get database instance
	database := client.Database(cfg.Database.Name)

	log.Info().
		Str("host", cfg.Database.Host).
		Str("port", cfg.Database.Port).
		Str("database", cfg.Database.Name).
		Msg("Successfully connected to MongoDB")

	return &Database{
		Client:   client,
		Database: database,
	}, nil
}

// Close closes the MongoDB connection
func (db *Database) Close() {
	if db.Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		err := db.Client.Disconnect(ctx)
		if err != nil {
			log.Error().Err(err).Msg("Error closing MongoDB connection")
		} else {
			log.Info().Msg("MongoDB connection closed")
		}
	}
}

// Ping checks if the MongoDB connection is alive
func (db *Database) Ping(ctx context.Context) error {
	if db.Client == nil {
		return fmt.Errorf("MongoDB client is nil")
	}
	return db.Client.Ping(ctx, readpref.Primary())
}

// GetCollection returns a collection instance
func (db *Database) GetCollection(name string) *mongo.Collection {
	return db.Database.Collection(name)
}

// CreateIndex creates an index on the specified collection
func (db *Database) CreateIndex(ctx context.Context, collection string, indexModel mongo.IndexModel) error {
	coll := db.GetCollection(collection)
	_, err := coll.Indexes().CreateOne(ctx, indexModel)
	return err
}

// CreateRecord creates a new record in the specified collection
func (db *Database) CreateRecord(ctx context.Context, collection string, document interface{}) (*mongo.InsertOneResult, error) {
	coll := db.GetCollection(collection)
	return coll.InsertOne(ctx, document)
}

// FindRecord finds a single record in the specified collection
func (db *Database) FindRecord(ctx context.Context, collection string, filter interface{}, result interface{}) error {
	coll := db.GetCollection(collection)
	return coll.FindOne(ctx, filter).Decode(result)
}

// FindRecords finds multiple records in the specified collection
func (db *Database) FindRecords(ctx context.Context, collection string, filter interface{}, results interface{}, opts ...*options.FindOptions) error {
	coll := db.GetCollection(collection)
	cursor, err := coll.Find(ctx, filter, opts...)
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)
	return cursor.All(ctx, results)
}

// UpdateRecord updates a single record in the specified collection
func (db *Database) UpdateRecord(ctx context.Context, collection string, filter interface{}, update interface{}) (*mongo.UpdateResult, error) {
	coll := db.GetCollection(collection)
	return coll.UpdateOne(ctx, filter, update)
}

// UpdateRecords updates multiple records in the specified collection
func (db *Database) UpdateRecords(ctx context.Context, collection string, filter interface{}, update interface{}) (*mongo.UpdateResult, error) {
	coll := db.GetCollection(collection)
	return coll.UpdateMany(ctx, filter, update)
}

// DeleteRecord deletes a single record from the specified collection
func (db *Database) DeleteRecord(ctx context.Context, collection string, filter interface{}) (*mongo.DeleteResult, error) {
	coll := db.GetCollection(collection)
	return coll.DeleteOne(ctx, filter)
}

// DeleteRecords deletes multiple records from the specified collection
func (db *Database) DeleteRecords(ctx context.Context, collection string, filter interface{}) (*mongo.DeleteResult, error) {
	coll := db.GetCollection(collection)
	return coll.DeleteMany(ctx, filter)
}

// CountDocuments counts documents in the specified collection
func (db *Database) CountDocuments(ctx context.Context, collection string, filter interface{}) (int64, error) {
	coll := db.GetCollection(collection)
	return coll.CountDocuments(ctx, filter)
}

// RunMigrations runs any necessary database migrations/setup
func (db *Database) RunMigrations() error {
	// Create indexes or perform any necessary setup here
	// For example, you might want to create indexes on commonly queried fields

	log.Info().Msg("Database migrations completed successfully")
	return nil
}
