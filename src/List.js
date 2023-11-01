import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Task from './Task';

const List = ({ list, tasks, addTask }) => {
  const [newTaskContent, setNewTaskContent] = useState('');

  const handleAddTask = () => {
    if (newTaskContent.trim() !== '') {
      addTask(list.id, newTaskContent);
      setNewTaskContent(''); // Clear the input field after adding a task
    }
  };

  return (
    <div className="list">
      <h2>{list.title}</h2>
      <Droppable droppableId={list.id}>
        {(provided) => (
          <ul className="tasks" {...provided.droppableProps} ref={provided.innerRef}>
            {tasks.map((task, index) => (
              <Task key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
      <div className="add-task">
        <input
          type="text"
          placeholder="Enter a new task..."
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
        />
        <button onClick={handleAddTask}>Add Task</button>
      </div>
    </div>
  );
};

export default List;

