import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import './App.css';
import List from './List';
import axios from 'axios';

function App() {
  const [lists, setLists] = useState([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (storedToken && storedUsername) {
      setToken(storedToken);
      setUsername(storedUsername);
      setIsSignedIn(true);
    }
    if (token && username) {
      // Fetch user's lists
      axios.get(`http://localhost:3000/lists/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Username': username,
        },
      })
        .then((response) => {
          setLists(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [token, username]);

  const fetchTasksForList = (listId) => {
    axios.get(`http://localhost:3000/tasks/${listId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        const updatedLists = lists.map((list) => {
          if (list.id === listId) {
            return { ...list, tasks: response.data };
          }
          return list;
        });
        setLists(updatedLists);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    if (isSignedIn) {
      lists.forEach((list) => fetchTasksForList(list.id));
    }
  }, [isSignedIn]);

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const sourceListId = result.source.droppableId;
    const destinationListId = result.destination.droppableId;
    const sourceList = lists.find((list) => list.id === sourceListId);
    const destinationList = lists.find((list) => list.id === destinationListId);

    const sourceTask = sourceList.tasks[result.source.index];
    sourceList.tasks.splice(result.source.index, 1);
    destinationList.tasks.splice(result.destination.index, 0, sourceTask);

    setLists([...lists]);

    // Update tasks on the server after reordering
    axios.put(`http://localhost:3000/tasks/${sourceListId}`, sourceList.tasks, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(() => {
        axios.put(`http://localhost:3000/tasks/${destinationListId}`, destinationList.tasks, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleSignIn = (username, password) => {
    axios.post('http://localhost:3000/login', { username, password })
      .then((response) => {
        const authToken = response.data.token;
        setToken(authToken);
        localStorage.setItem('token', authToken);
        setUsername(username);
        localStorage.setItem('username', username);
        setIsSignedIn(true);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleSignUp = (username, password) => {
    axios.post('http://localhost:3000/signup', { username, password })
      .then((response) => {
        // After successful registration, automatically sign in
        handleSignIn(username, password);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleSignOut = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsSignedIn(false);
  };

  const addTask = (listId, content) => {
    axios.post('http://localhost:3000/tasks', { content, completed: false, todoListId: listId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        fetchTasksForList(listId);
      })
      .catch((error) => {
        console.error('Error adding task:', error);
      });
  };

  const addList = (title) => {
    axios.post('http://localhost:3000/todo-lists', { title, userId: username }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(() => {
        // Fetch updated lists after adding a list
        axios.get(`http://localhost:3000/lists/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Username': username,
          },
        })
          .then((response) => {
            setLists(response.data);
          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error('Error adding list:', error);
      });
  };

  const AuthenticationComponent = ({ onSignIn, onSignUp }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = () => {
      if (isSignUp) {
        onSignUp(newUsername, newPassword);
      } else {
        onSignIn(newUsername, newPassword);
      }
    };

    return (
      <div className="authentication-container">
        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        <input
          type="text"
          placeholder="Username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handleSubmit}>{isSignUp ? 'Sign Up' : 'Sign In'}</button>
        <p onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
        </p>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Drag and Drop Lists with Tasks</h1>
        <div className="lists-container">
          {isSignedIn ? (
            <>
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="all-lists" direction="horizontal" type="list">
                  {(provided) => (
                    <div
                      className="all-lists"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {lists.map((list, index) => (
                        <List
                          key={list.id}
                          list={list}
                          tasks={list.tasks}
                          addTask={addTask}
                          index={index}
                          fetchTasksForList={fetchTasksForList}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <div className="add-list">
                <input type="text" placeholder="New List Title" />
                <button onClick={() => addList('New List')}>Add List</button>
              </div>
              <button onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <AuthenticationComponent onSignIn={handleSignIn} onSignUp={handleSignUp} />
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
