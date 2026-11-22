FROM nginx:alpine

# Só o site estático (a pasta fonte/ e o backup ficam fora da imagem)
RUN rm -rf /usr/share/nginx/html/*
COPY site/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
