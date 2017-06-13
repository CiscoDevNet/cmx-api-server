openssl genrsa -out ../config/certs/server-key.pem 1024
openssl req -new -config openssl.cnf -key ../config/certs/server-key.pem -out ../config/certs/server-csr.pem
openssl x509 -req -in ../config/certs/server-csr.pem -signkey ../config/certs/server-key.pem -out ../config/certs/server-cert.pem