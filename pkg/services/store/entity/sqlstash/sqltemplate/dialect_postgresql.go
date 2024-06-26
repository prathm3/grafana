package sqltemplate

import (
	"errors"
	"strings"
)

// PostgreSQL is an implementation of Dialect for the PostgreSQL DMBS.
var PostgreSQL postgresql

var _ Dialect = PostgreSQL

// PostgreSQL-specific errors.
var (
	ErrPostgreSQLUnsupportedIdent = errors.New("identifiers in PostgreSQL cannot contain the character with code zero")
)

type postgresql struct {
	standardIdent
}

func (p postgresql) Ident(s string) (string, error) {
	// See:
	//	https://www.postgresql.org/docs/current/sql-syntax-lexical.html
	if strings.IndexByte(s, 0) != -1 {
		return "", ErrPostgreSQLUnsupportedIdent
	}

	return p.standardIdent.Ident(s)
}

func (postgresql) SelectFor(s ...string) (string, error) {
	return rowLockingClauseAll(true).SelectFor(s...)
}
