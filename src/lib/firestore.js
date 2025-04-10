import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
} from "firebase/firestore";

export async function addNote(userId, { title, content }) {
    try {
        const docRef = await addDoc(collection(db, "notes"), {
            userId: userId,
            title,
            content,
            createdAt: new Date().toISOString(),
        });
        // console.log("Note added: ", docRef.id);
    } catch (error) {
        console.error("Add note error: ", error);
        throw error;
    }
}

export async function getUserNotes(userId) {
    try {
        const q = query(
            collection(db, "notes"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const notes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return notes;
    } catch (error) {
        console.error("fetch notes error: ", error);
        return [];
    }
}

export async function deleteNote(userId, noteId) {
    try {
        await deleteDoc(doc(db, "notes", noteId));
        // console.log("Note deleted: ", noteId);
    } catch (error) {
        console.error("delete note error: ", error);
        throw error;
    }
}
export async function updateNote(userId, noteId, { title, content }) {
    try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
            title,
            content,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("delete note error: ", error);
        throw error;
    }
}
