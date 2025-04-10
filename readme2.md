# Modern Firebase + React Guide (2024)
## Building a Todo App with Images

![Modern Todo App Preview](https://i.imgur.com/xyz1234.png)

## 🔧 Tech Stack
- **Frontend**: 
  - React 18+ (with hooks)
  - Vite (instead of CRA)
  - TypeScript
- **Firebase**: 
  - Firebase v10+ (modular SDK)
  - Firestore (with real-time updates)
  - Storage (for file uploads)
  - Authentication (Email + Google)
  - Security Rules
- **Deployment**: Firebase Hosting

---

# 🚀 1. Project Setup

### 1.1 Create Vite + React + TS Project
```bash
npm create vite@latest todo-app -- --template react-ts
cd todo-app
npm install firebase @mui/material @mui/icons-material react-router-dom
npm install -D @types/react @types/react-dom
```

### 1.2 Firebase Configuration
`src/lib/firebase.ts`:
```typescript
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  connectAuthEmulator 
} from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator 
} from "firebase/firestore";
import { 
  getStorage, 
  connectStorageEmulator 
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Emulators (dev only)
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

`.env.local`:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

---

# 🔐 2. Authentication (Modern Approach)

### 2.1 Auth Context with TypeScript
`src/contexts/AuthContext.tsx`:
```typescript
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { 
  createContext, 
  useContext, 
  useEffect, 
  useState 
} from "react";
import { auth } from "../lib/firebase";

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 2.2 Auth Components
`src/components/auth/SignInForm.tsx`:
```typescript
import { useAuth } from "../../contexts/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

---

# 🗃️ 3. Firestore with Real-time Updates

### 3.1 Todo Service
`src/services/todo.ts`:
```typescript
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  userId: string;
  imageUrl?: string;
};

export const subscribeToTodos = (
  userId: string,
  callback: (todos: Todo[]) => void
) => {
  const q = query(
    collection(db, "todos"),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const todos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Todo[];
    callback(todos);
  });
};

export const addTodo = async (text: string, userId: string) => {
  await addDoc(collection(db, "todos"), {
    text,
    completed: false,
    userId,
    createdAt: serverTimestamp(),
  });
};

export const toggleTodo = async (id: string, completed: boolean) => {
  await updateDoc(doc(db, "todos", id), {
    completed: !completed,
  });
};

export const deleteTodo = async (id: string) => {
  await deleteDoc(doc(db, "todos", id));
};
```

### 3.2 Todo Component
`src/components/TodoList.tsx`:
```typescript
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToTodos, Todo, toggleTodo, deleteTodo } from "../services/todo";

export function TodoList() {
  const { currentUser } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = subscribeToTodos(currentUser.uid, (todos) => {
      setTodos(todos);
    });

    return unsubscribe;
  }, [currentUser]);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id, todo.completed)}
          />
          <span>{todo.text}</span>
          {todo.imageUrl && (
            <img 
              src={todo.imageUrl} 
              alt="Todo attachment" 
              width={100} 
            />
          )}
          <button onClick={() => deleteTodo(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

---

# 📁 4. File Storage

### 4.1 Storage Service
`src/services/storage.ts`:
```typescript
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from "firebase/storage";
import { storage } from "../lib/firebase";

export const uploadFile = async (file: File, userId: string) => {
  const storageRef = ref(storage, `todos/${userId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const deleteFile = async (url: string) => {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
};
```

### 4.2 Todo Form with Image Upload
`src/components/AddTodo.tsx`:
```typescript
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { addTodo } from "../services/todo";
import { uploadFile } from "../services/storage";

export function AddTodo() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !text) return;

    let imageUrl = "";
    if (file) {
      imageUrl = await uploadFile(file, currentUser.uid);
    }

    await addTodo(text, currentUser.uid);
    setText("");
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add new todo"
        required
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button type="submit">Add</button>
    </form>
  );
}
```

---

# 🔒 5. Security Rules (2024 Syntax)

### 5.1 Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{todoId} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == resource.data.userId;
      
      allow create: if request.auth != null &&
                    request.resource.data.userId == request.auth.uid &&
                    request.resource.data.text is string &&
                    request.resource.data.completed is boolean;
    }
  }
}
```

### 5.2 Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /todos/{userId}/{fileName} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == userId;
    }
  }
}
```

---

# 🚀 6. Deployment

### 6.1 Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 6.2 Initialize Hosting
```bash
firebase init hosting
```
Select:
- Existing project
- Public directory: `dist`
- Configure as SPA: Yes
- Set up automatic builds: No

### 6.3 Build and Deploy
```bash
npm run build
firebase deploy
```

---

# 🛠️ 7. Bonus: Modern Patterns

### 7.1 Custom Hooks
`src/hooks/useTodos.ts`:
```typescript
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToTodos, Todo } from "../services/todo";

export const useTodos = () => {
  const { currentUser } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = subscribeToTodos(currentUser.uid, setTodos);
    return unsubscribe;
  }, [currentUser]);

  return todos;
};
```

### 7.2 Error Boundary
`src/components/ErrorBoundary.tsx`:
```typescript
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

---

# 🎯 Final Project Structure
```
src/
├── lib/
│   └── firebase.ts
├── contexts/
│   └── AuthContext.tsx
├── services/
│   ├── todo.ts
│   └── storage.ts
├── hooks/
│   └── useTodos.ts
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx
│   │   └── GoogleSignIn.tsx
│   ├── TodoList.tsx
│   ├── AddTodo.tsx
│   └── ErrorBoundary.tsx
├── App.tsx
└── main.tsx
```

## Key Improvements:
1. **Vite** instead of CRA (faster builds)
2. **TypeScript** for type safety
3. **Modular Firebase v10+** imports
4. **Emulator support** for local development
5. **Custom hooks** for cleaner components
6. **Proper error boundaries**
7. **Modern security rules**
8. **Strict typing** throughout the app

This implementation uses all current best practices for Firebase and React development in 2024. The app includes:
- Type-safe Firebase operations
- Real-time Firestore subscriptions
- Secure file uploads
- Authentication with state management
- Proper error handling
- Local emulator support
- Optimized build process