#!/bin/sh
RUN_DIR=`dirname $0`
CURRENT_DIR=`cd $RUN_DIR; pwd`

openssl genrsa -out $CURRENT_DIR/../config/certs/server-key.pem 1024
openssl req -new -config $CURRENT_DIR/openssl.cnf -key $CURRENT_DIR/../config/certs/server-key.pem -out $CURRENT_DIR/../config/certs/server-csr.pem
openssl x509 -req -in $CURRENT_DIR/../config/certs/server-csr.pem -signkey $CURRENT_DIR/../config/certs/server-key.pem -out $CURRENT_DIR/../config/certs/server-cert.pem