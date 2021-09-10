# Authentication and Authorization for Microservices

## JWT Keys

```

# ssh-keygen -t rsa -b 2048 -f jwtRS256.key
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
# Don't add passphrase
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub

# OR

openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

```

  - Place these keys inside "src/config/keys" folder and update .env by converting content of files into a single
  line using following command.

```

awk -v ORS='\\n' '1' src/config/keys/private.pem | pbcopy
awk -v ORS='\\n' '1' src/config/keys/public.pem | pbcopy

```
