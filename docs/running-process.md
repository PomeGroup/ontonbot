windows+wsl sarem:

change nginx.conf

```
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    server {
        listen       90;
        server_name  localhost;

        location / {
            root   html;
            index  index.html index.htm;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
    server {
       listen       8000;

       location / {
        rewrite ^/(.*)$ http://localhost:3000/$1 permanent;
       }
    }
}
```

run nginx.exe with admin

ngrok http --domain=merry-jackal-closely.ngrok-free.app 8000 --response-header-add='Content-Security-Policy: upgrade-insecure-requests'
ngrok http 8000 --response-header-add='Content-Security-Policy: upgrade-insecure-requests'

send app URL to botfather.

making sure redis and postgress container are running.

give admin access to yourself on database

pnpm run dev
