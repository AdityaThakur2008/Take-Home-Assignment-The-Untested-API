const taskService = require('../src/services/taskService');

describe('taskService Unit Tests', () => {
  // clear in-memory tasks before every test
  beforeEach(() => {
    taskService._reset();
  });

  describe('create and getAll', () => {
    it('should create a task with default values and retrieve it', () => {
      const task = taskService.create({ title: 'Write tests' });
      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Write tests');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.completedAt).toBeNull();

      const all = taskService.getAll();
      expect(all.length).toBe(1);
      expect(all[0].id).toBe(task.id);
    });
  });

  describe('findById', () => {
    it('should return undefined when task does not exist', () => {
      const found = taskService.findById('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should find task by id', () => {
      const created = taskService.create({ title: 'Task to find' });
      const found = taskService.findById(created.id);
      expect(found).toEqual(created);
    });
  });

  describe('getStats', () => {
    it('should calculate status counts and overdue items accurately', () => {
      const pastDate = new Date(Date.now() - 500000).toISOString();
      const futureDate = new Date(Date.now() + 500000).toISOString();

      taskService.create({ title: 'Task 1', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'Task 2', status: 'in_progress', dueDate: futureDate });
      taskService.create({ title: 'Task 3', status: 'done', dueDate: pastDate });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(1);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('remove', () => {
    it('should return false when removing non-existent task', () => {
      expect(taskService.remove('fake-id')).toBe(false);
    });

    it('should delete existing task and return true', () => {
      const task = taskService.create({ title: 'Delete me' });
      expect(taskService.remove(task.id)).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    it('should filter by exact status match', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });

      const todos = taskService.getByStatus('todo');
      expect(todos.length).toBe(1);
      expect(todos[0].title).toBe('Task 1');
    });
  });

  describe('getPaginated', () => {
    it('should return correct 0-indexed items on page 1', () => {
      for (let i = 1; i <= 15; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const page1 = taskService.getPaginated(1, 10);
      expect(page1.length).toBe(10);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[9].title).toBe('Task 10');

      const page2 = taskService.getPaginated(2, 10);
      expect(page2.length).toBe(5);
      expect(page2[0].title).toBe('Task 11');
    });
  });

  describe('update', () => {
    it('should return null for invalid task id', () => {
      expect(taskService.update('non-existent', { title: 'New' })).toBeNull();
    });

    it('should update task and disallow changing id', () => {
      const task = taskService.create({ title: 'Original' });
      const updated = taskService.update(task.id, { title: 'Updated', id: 'tampered-id' });

      expect(updated.title).toBe('Updated');
      expect(updated.id).toBe(task.id);
    });
  });

  describe('completeTask', () => {
    it('should return null if task does not exist', () => {
      expect(taskService.completeTask('invalid')).toBeNull();
    });

    it('should retain initial priority when marking task as done', () => {
      const task = taskService.create({ title: 'High priority', priority: 'high' });
      const completed = taskService.completeTask(task.id);

      expect(completed.status).toBe('done');
      expect(completed.priority).toBe('high');
      expect(completed.completedAt).not.toBeNull();
    });
  });

  describe('assignTask', () => {
    it('should return null if target task does not exist', () => {
      expect(taskService.assignTask('invalid', 'Aditya')).toBeNull();
    });

    it('should assign user and trim whitespace', () => {
      const task = taskService.create({ title: 'Unassigned task' });
      const updated = taskService.assignTask(task.id, '  Aditya  ');
      expect(updated.assignee).toBe('Aditya');
    });
  });

});