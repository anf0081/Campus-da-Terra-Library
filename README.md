# Campus da Terra Library

Campus da Terra Library is a full-stack web application for managing a school library, including book lending, user authentication, and admin features. The project is split into two parts:

- **CDT Backend**: Node.js, Express, MongoDB (Mongoose)
- **CDT Frontend**: React (with Vite), Axios

## Features

- User authentication (JWT)
- Role-based access (admin, tutor, user)
- Book management (add, update, delete, lend, return)
- Lending history and due dates
- Student and parent information management
- Responsive, modern UI

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB instance (local or cloud)

### Setup

#### 1. Backend

```sh
cd "CDT Backend"
cp .env.example .env   # create your .env file with MongoDB URI and SECRET
npm install
npm run dev            # or npm start for production

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.