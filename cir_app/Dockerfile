# syntax=docker/dockerfile:1
FROM python:3
ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY requirements.txt /code/
RUN pip install --upgrade pip
RUN apt-get update
RUN pip install -r requirements.txt
COPY . /code/
RUN chmod +x start_it_up.sh
ENTRYPOINT ["/bin/bash", "start_it_up.sh"]