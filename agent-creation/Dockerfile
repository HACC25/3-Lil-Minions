FROM python:3.11-slim

WORKDIR /main

COPY requirements.txt .

COPY key.json .

RUN pip install --no-cache-dir --timeout 1000 -r requirements.txt
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]