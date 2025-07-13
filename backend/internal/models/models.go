package models

// AllModels returns a slice of all model types for migration
func AllModels() []interface{} {
	return []interface{}{
		// Core models
		(*User)(nil),
		(*UserSession)(nil),
		(*RefreshToken)(nil),
		(*Video)(nil),
		(*Clip)(nil),
		(*Tag)(nil),
		(*Playlist)(nil),
		(*Favorite)(nil),
		(*SharedPlaylist)(nil),
	}
}
