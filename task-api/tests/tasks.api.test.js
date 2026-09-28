const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Tasks API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    it('should return 200 and all tasks', async () => {
      taskService.create({ title: 'Sample 1' });
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('should filter tasks by status', async () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });

      const res = await request(app).get('/tasks?status=todo');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('todo');
    });
  });

  it('should support pagination combined with status filtering', async () => {
      for (let i = 1; i <= 6; i++) {
        taskService.create({ title: `Todo ${i}`, status: 'todo' });
      }
      taskService.create({ title: 'Done 1', status: 'done' });

      const res = await request(app).get('/tasks?status=todo&page=1&limit=3');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      expect(res.body[0].title).toBe('Todo 1');
      expect(res.body.every((t) => t.status === 'todo')).toBe(true);
    });

  describe('GET /tasks/stats', () => {
    it('should return accurate status counts including overdue metrics', async () => {
 
  const pastDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
  const futureDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day in the future


  taskService.create({ title: 'Task 1', status: 'todo', dueDate: pastDueDate });
  
  taskService.create({ title: 'Task 2', status: 'in_progress', dueDate: futureDueDate });
  

  taskService.create({ title: 'Task 3', status: 'done', dueDate: pastDueDate });

  const res = await request(app).get('/tasks/stats');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    todo: 1,
    in_progress: 1,
    done: 1,
    overdue: 1, 
  });
});
  });

  describe('POST /tasks', () => {
    it('should create a new task with 201 status', async () => {
      const payload = { title: 'Test Task', priority: 'high', status: 'todo' };
      const res = await request(app).post('/tasks').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe(payload.title);
      expect(res.body.priority).toBe('high');
      expect(res.body).toHaveProperty('id');
    });

    it('should reject requests when title is missing (400 Bad Request)', async () => {
  const res = await request(app).post('/tasks').send({});
  
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');
});




it('should reject requests when title is only whitespace (400 Bad Request)', async () => {
  const res = await request(app).post('/tasks').send({ title: '   ' });
  
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');
});

    it('should reject invalid status strings', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Valid', status: 'invalid-status' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update existing task', async () => {
      const task = taskService.create({ title: 'Initial Title' });
      const res = await request(app).put(`/tasks/${task.id}`).send({ title: 'Updated Title' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).put('/tasks/invalid-id').send({ title: 'Updated' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should return 204 when deleted', async () => {
      const task = taskService.create({ title: 'Delete me' });
      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);
    });

    it('should return 404 when deleting invalid id', async () => {
      const res = await request(app).delete('/tasks/invalid-id');
      expect(res.status).toBe(404);
    });
  });

 describe('PATCH /tasks/:id/complete', () => {

    it('should mark task as completed and return 200', async () => {
      const task = taskService.create({ title: 'Task to complete' });
      
      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('should return 404 when task id is invalid', async () => {
      const res = await request(app).patch('/tasks/invalid-id/complete');
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('should assign a user to the task', async () => {
      const task = taskService.create({ title: 'Task to assign' });
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Aditya' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Aditya');
    });

    it('should reject missing or empty assignee with 400', async () => {
      const task = taskService.create({ title: 'Task' });
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '   ' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 when assigning non-existent task', async () => {
      const res = await request(app)
        .patch('/tasks/missing-id/assign')
        .send({ assignee: 'Aditya' });

      expect(res.status).toBe(404);
    });
  });
});