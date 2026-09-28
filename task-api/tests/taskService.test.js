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
});