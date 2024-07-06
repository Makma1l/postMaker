import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Header from "./components/Header";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Home from "./components/Home";
import NewPost from "./components/NewPost";
import PostPage from "./components/PostPage";
import About from "./components/About";
import Missing from "./components/Missing";

function App() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [fetchError, setFetchError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPosts = async () => {
      try {
        const response = await fetch(
          "https://renderserver-ww79.onrender.com/posts",
          { signal }
        );
        if (!response.ok) {
          const responseText = await response.text();
          throw new Error(`Something went wrong: ${responseText}`);
        }
        const data = await response.json();
        setPosts(data);
        setFetchError(null);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch request cancelled");
        } else {
          console.error(error);
          setFetchError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (posts.length) {
      const filteredResults = posts.filter(
        (post) =>
          post.body.toLowerCase().includes(search.toLowerCase()) ||
          post.title.toLowerCase().includes(search.toLowerCase())
      );
      setSearchResults(filteredResults.reverse());
    } else {
      setSearchResults([]);
    }
  }, [posts, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = posts.length ? posts[posts.length - 1].id + 1 : 1;
    const datetime = format(new Date(), "MMMM dd, yyyy pp");
    const newPost = { id, title: postTitle, datetime, body: postBody };

    try {
      const response = await fetch(
        "https://renderserver-ww79.onrender.com/posts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newPost),
        }
      );
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Network response was not ok: ${responseText}`);
      }
      const result = await response.json();
      setPosts([...posts, result]);
      setPostTitle("");
      setPostBody("");
      navigate("/");
    } catch (error) {
      console.error("Error adding post", error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `https://renderserver-ww79.onrender.com/posts/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Network response was not ok: ${responseText}`);
      }
      const postsList = posts.filter((post) => post.id !== id);
      setPosts(postsList);
      navigate("/");
    } catch (error) {
      console.error("Error deleting post", error.message);
    }
  };

  return (
    <div className="App">
      <Header title="React JS Blog" />
      <Nav search={search} setSearch={setSearch} />
      {isLoading && <p>Loading...</p>}
      {fetchError && <p style={{ color: "red" }}>{fetchError}</p>}
      <Routes>
        <Route path="/" element={<Home posts={searchResults} />} />
        <Route
          path="/post"
          element={
            <NewPost
              handleSubmit={handleSubmit}
              postTitle={postTitle}
              setPostTitle={setPostTitle}
              postBody={postBody}
              setPostBody={setPostBody}
            />
          }
        />
        <Route
          path="/post/:id"
          element={<PostPage posts={posts} handleDelete={handleDelete} />}
        />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Missing />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
