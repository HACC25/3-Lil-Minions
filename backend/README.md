# Backend Setup Guide

## Getting Started

Follow these steps to set up and run the backend:

1. Navigate to backend directory:

   ```
   cd backend
   ```

2. Create virtual environment:

   ```
   python -m venv venv
   python3 -m venv venv
   ```

3. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

4. Install dependencies:

   ```
   pip install -r requirements.txt
   pip3 install -r requirements.txt
   ```

5. Start the development server:

   ```
   uvicorn main:app --reload
   ```

6. To build on Docker:

```
docker buildx build --platform linux/amd64,linux/arm64 -t lionelroxas/htw-v4:latest --push .
```

The server will start on `http://localhost:8000` with auto-reload enabled.
