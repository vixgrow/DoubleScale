#!/usr/bin/env bash
#
# Install the WordPress core test suite + a throwaway WordPress install for
# PHPUnit integration tests. Canonical layout used by most WP plugin projects.
#
# Usage:
#   bash bin/install-wp-tests.sh <db-name> <db-user> <db-pass> [db-host] [wp-version] [skip-database-creation]
#
# Example:
#   bash bin/install-wp-tests.sh wordpress_test root '' 127.0.0.1 latest
#
# Environment overrides:
#   WP_TESTS_DIR   - where the WP test library is installed (default: /tmp/wordpress-tests-lib)
#   WP_CORE_DIR    - where WordPress core is installed (default: /tmp/wordpress/)

set -euo pipefail

if [ $# -lt 3 ]; then
	echo "usage: $0 <db-name> <db-user> <db-pass> [db-host] [wp-version] [skip-database-creation]"
	exit 1
fi

DB_NAME=$1
DB_USER=$2
DB_PASS=$3
DB_HOST=${4-127.0.0.1}
WP_VERSION=${5-latest}
SKIP_DB_CREATE=${6-false}

WP_TESTS_DIR=${WP_TESTS_DIR-/tmp/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR-/tmp/wordpress/}

download() {
	if command -v curl >/dev/null 2>&1; then
		curl -sSL "$1" -o "$2"
	elif command -v wget >/dev/null 2>&1; then
		wget -nv -O "$2" "$1"
	else
		echo "neither curl nor wget is installed" >&2
		exit 1
	fi
}

if [[ "$WP_VERSION" =~ ^[0-9]+\.[0-9]+$ ]]; then
	WP_TESTS_TAG="branches/$WP_VERSION"
elif [[ "$WP_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	if [[ "$WP_VERSION" =~ ^[0-9]+\.[0-9]+\.[0]$ ]]; then
		WP_TESTS_TAG="tags/${WP_VERSION%.0}"
	else
		WP_TESTS_TAG="tags/$WP_VERSION"
	fi
elif [[ "$WP_VERSION" == 'nightly' || "$WP_VERSION" == 'trunk' ]]; then
	WP_TESTS_TAG="trunk"
else
	# look for the latest stable tag from the version-check API
	download https://api.wordpress.org/core/version-check/1.7/ /tmp/wp-latest.json
	grep -o '"version":"[^"]*' /tmp/wp-latest.json | sed 's/"version":"//' | head -1 > /tmp/wp-latest.txt
	LATEST_VERSION=$(cat /tmp/wp-latest.txt)
	if [ -z "$LATEST_VERSION" ]; then
		echo "Latest WordPress version could not be found" >&2
		exit 1
	fi
	WP_TESTS_TAG="tags/$LATEST_VERSION"
fi

install_wp() {
	if [ -d "$WP_CORE_DIR" ]; then
		return
	fi

	mkdir -p "$WP_CORE_DIR"

	if [[ "$WP_VERSION" == 'nightly' || "$WP_VERSION" == 'trunk' ]]; then
		mkdir -p /tmp/wordpress-nightly
		download https://wordpress.org/nightly-builds/wordpress-latest.zip /tmp/wordpress-nightly/wordpress-nightly.zip
		unzip -q /tmp/wordpress-nightly/wordpress-nightly.zip -d /tmp/wordpress-nightly/
		mv /tmp/wordpress-nightly/wordpress/* "$WP_CORE_DIR"
	else
		if [ "$WP_VERSION" == 'latest' ]; then
			local ARCHIVE_NAME='latest'
		elif [[ "$WP_VERSION" =~ [0-9]+\.[0-9]+ ]]; then
			download https://api.wordpress.org/core/version-check/1.7/ /tmp/wp-latest.json
			LATEST_VERSION=$(grep -o '"version":"[^"]*' /tmp/wp-latest.json | sed 's/"version":"//' | head -1)
			if [[ -z "$LATEST_VERSION" ]]; then
				local ARCHIVE_NAME="wordpress-$WP_VERSION"
			else
				local ARCHIVE_NAME="wordpress-$LATEST_VERSION"
			fi
		else
			local ARCHIVE_NAME="wordpress-$WP_VERSION"
		fi
		download "https://wordpress.org/${ARCHIVE_NAME}.tar.gz" /tmp/wordpress.tar.gz
		tar --strip-components=1 -zxmf /tmp/wordpress.tar.gz -C "$WP_CORE_DIR"
	fi

	download https://raw.githubusercontent.com/markoheijnen/wp-mysqli/master/db.php "$WP_CORE_DIR/wp-content/db.php"
}

install_test_suite() {
	if [ ! -d "$WP_TESTS_DIR" ]; then
		mkdir -p "$WP_TESTS_DIR"
		svn co --quiet "https://develop.svn.wordpress.org/${WP_TESTS_TAG}/tests/phpunit/includes/" "$WP_TESTS_DIR/includes"
		svn co --quiet "https://develop.svn.wordpress.org/${WP_TESTS_TAG}/tests/phpunit/data/" "$WP_TESTS_DIR/data"
	fi

	if [ ! -f "$WP_TESTS_DIR/wp-tests-config.php" ]; then
		download https://develop.svn.wordpress.org/${WP_TESTS_TAG}/wp-tests-config-sample.php "$WP_TESTS_DIR/wp-tests-config.php"
		# Portable sed on linux + macOS.
		if [[ "$(uname -s)" == 'Darwin' ]]; then
			SED_INPLACE=(-i '')
		else
			SED_INPLACE=(-i)
		fi
		sed "${SED_INPLACE[@]}" "s:dirname( __FILE__ ) . '/src/':'${WP_CORE_DIR}':" "$WP_TESTS_DIR/wp-tests-config.php"
		sed "${SED_INPLACE[@]}" "s/youremptytestdbnamehere/${DB_NAME}/" "$WP_TESTS_DIR/wp-tests-config.php"
		sed "${SED_INPLACE[@]}" "s/yourusernamehere/${DB_USER}/" "$WP_TESTS_DIR/wp-tests-config.php"
		sed "${SED_INPLACE[@]}" "s/yourpasswordhere/${DB_PASS}/" "$WP_TESTS_DIR/wp-tests-config.php"
		sed "${SED_INPLACE[@]}" "s|localhost|${DB_HOST}|" "$WP_TESTS_DIR/wp-tests-config.php"
	fi
}

install_db() {
	if [ "$SKIP_DB_CREATE" = "true" ]; then
		return
	fi

	# Parse host[:port] / host:socket.
	local PARTS
	IFS=':' read -ra PARTS <<< "$DB_HOST"
	local DB_HOSTNAME=${PARTS[0]}
	local DB_SOCK_OR_PORT=${PARTS[1]-}
	local EXTRA=""

	if [ -n "$DB_HOSTNAME" ]; then
		if [ -z "$DB_SOCK_OR_PORT" ]; then
			EXTRA=" --host=$DB_HOSTNAME --protocol=tcp"
		elif [[ "$DB_SOCK_OR_PORT" =~ ^[0-9]+$ ]]; then
			EXTRA=" --host=$DB_HOSTNAME --port=$DB_SOCK_OR_PORT --protocol=tcp"
		else
			EXTRA=" --socket=$DB_SOCK_OR_PORT"
		fi
	fi

	# `mysqladmin create` is idempotent enough if we ignore "database exists".
	mysqladmin create "$DB_NAME" --user="$DB_USER" --password="$DB_PASS"$EXTRA 2>/dev/null || true
}

install_wp
install_test_suite
install_db

echo "WordPress test suite installed."
echo "  WP_CORE_DIR  = $WP_CORE_DIR"
echo "  WP_TESTS_DIR = $WP_TESTS_DIR"
echo "Now run:  composer test:integration"
