import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";
import {
    addNote,
    deleteNote,
    getUserNotes,
    updateNote,
} from "../lib/firestore";

export const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState("");
    const [selectedNote, setSelectedNote] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [modalMenuOpen, setModalMenuOpen] = useState(false);
    const [editedContent, setEditedContent] = useState("");
    const [editedTitle, setEditedTitle] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const contentRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotes();
        }
    }, [user]);

    useEffect(() => {
        if (selectedNote && contentRef.current) {
            contentRef.current.innerText = selectedNote.content;
        }
    }, [selectedNote]);

    const fetchNotes = async () => {
        setIsFetching(true);
        try {
            const userNotes = await getUserNotes(user.uid);
            const safeNotes = userNotes.map((note) => ({
                ...note,
                title: note.title ?? "Untitled", // fallback for old notes
            }));
            setNotes(safeNotes);
            // console.log("Fetched notes: ", userNotes);
        } catch (error) {
            console.error("Failed to fetch notes: ", error);
        }
        setIsFetching(false);
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            setError("Note can't be empty");
            return;
        }
        const titleToUse = newTitle.trim() || "Untitled";
        setIsAdding(true);
        setError("");
        try {
            await addNote(user.uid, { title: titleToUse, content: newNote });
            setNewNote("");
            setNewTitle("");
            await fetchNotes();
        } catch (error) {
            setError("failed to fetch note.");
        }
        setIsAdding(false);
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await deleteNote(user.uid, noteId);
            await fetchNotes();
        } catch (error) {
            setError("failed to fetch note");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed! ", error);
        }
    };

    const handleCloseModal = async () => {
        const contentChanged =
            (editedContent ?? "").trim() !==
            (selectedNote?.content ?? "").trim();
        const titleChanged =
            (editedTitle ?? "").trim() !== (selectedNote?.title ?? "").trim();

        if (contentChanged || titleChanged) {
            try {
                await updateNote(user.uid, selectedNote.id, {
                    title: editedTitle,
                    content: editedContent,
                });
                await fetchNotes();
            } catch (error) {
                console.error("Auto save failed!", error);
            }
        }

        setSelectedNote(null);
        setModalMenuOpen(false);
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 p-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                    {user.photoURL && (
                        <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-10 h-10 rounded-full border-2 border-orange-500"
                        />
                    )}
                    <h1 className="text-xl sm:text-2xl">
                        Welcome <strong>{user.email}</strong>
                    </h1>
                </div>

                <button
                    className="bg-orange-500 px-2 py-1 text-white rounded-lg"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>

            <h3 className="text-2xl text-center my-3">
                Keep your thoughts here-add notes below
            </h3>
            <div className="flex flex-col gap-2 justify-center max-w-[500px] m-auto px-4">
                <input
                    className="border p-2 rounded-md"
                    type="text"
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={isFetching}
                />
                <textarea
                    className="border-1 p-4 rounded-md w-full min-h-[100px]"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type your note..."
                    disabled={isFetching}
                ></textarea>
                <button
                    className="bg-orange-500 px-2 py-1 text-white rounded-lg"
                    onClick={handleAddNote}
                    disabled={isAdding}
                >
                    {isAdding ? "Adding..." : "Add Note"}
                </button>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <h1 className="text-3xl text-center my-3 font-bold">Your Notes</h1>
            {isFetching && !notes.length ? (
                <p className="ml-4">Loading notes...</p>
            ) : notes.length === 0 ? (
                <p className="ml-4">No notes yet-add one above!</p>
            ) : (
                <div className="flex flex-wrap justify-center gap-4 px-4 max-w-6xl mx-auto my-5">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => {
                                setSelectedNote(note);
                                setEditedTitle(note.title ?? "");
                                setEditedContent(note.content ?? "");
                            }}
                            className="relative bg-yellow-500 rounded-lg p-4 cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md w-full min-w-[250px] sm:w-[45%] md:w-[30%] lg:w-[22%] max-w-[300px] break-words"
                        >
                            {/* Top-right menu */}
                            <div className="absolute top-2 right-2 z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(
                                            note.id === menuOpenId
                                                ? null
                                                : note.id
                                        );
                                    }}
                                    className="text-black font-bold cursor-pointer"
                                >
                                    ⋮
                                </button>

                                {menuOpenId === note.id && (
                                    <div className="absolute right-0 mt-1 bg-white shadow-md rounded-md p-2">
                                        <button
                                            className="text-red-500 hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNote(note.id);
                                                setMenuOpenId(null);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold mb-2">
                                {note.title}
                            </h3>

                            {/* Note preview */}
                            <p className="text-base whitespace-pre-wrap overflow-hidden">
                                {note.content.slice(0, 100)}
                                {note.content.length > 100 && "..."}
                            </p>

                            <p className="text-sm mt-2">
                                {new Date(note.createdAt).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* modal */}
            {selectedNote && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-yellow-500 text-black rounded-xl p-4 sm:p-6 shadow-xl relative flex flex-col w-[90vw] sm:w-[70vw] max-h-[80vh] overflow-y-auto custom-scrollbar"

                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top buttons */}
                        <button
                            className="absolute top-2 right-2 text-2xl font-bold text-black"
                            onClick={(e) => {
                                e.stopPropagation();
                                setModalMenuOpen((prev) => !prev);
                            }}
                        >
                            ⋮
                        </button>

                        {modalMenuOpen && (
                            <div className="absolute right-2 top-10 bg-white shadow-md rounded-md p-2 z-50">
                                <button
                                    className="text-red-500 hover:underline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNote(selectedNote.id);
                                        setSelectedNote(null);
                                        setModalMenuOpen(false);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        )}

                        <button
                            className="absolute top-2 left-2 text-4xl text-red-500 font-bold"
                            onClick={handleCloseModal}
                        >
                            &times;
                        </button>

                        {/* Content Scroll Area */}
                        <div className="mt-12 space-y-4">
                            <input
                                className="text-2xl font-bold w-full bg-transparent outline-none"
                                type="text"
                                placeholder="Title"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                            />

                            <div
                                ref={contentRef}
                                contentEditable
                                suppressContentEditableWarning
                                className="whitespace-pre-wrap text-lg outline-none"
                                style={{
                                    minHeight: "150px",
                                }}
                                onBlur={(e) =>
                                    setEditedContent(e.currentTarget.innerText)
                                }
                            >
                                {editedContent}
                            </div>

                            <p className="text-sm text-right text-black/70">
                                Last edited:{" "}
                                {new Date(
                                    selectedNote.createdAt
                                ).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Home;
