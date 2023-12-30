require('dotenv').config()

const mysql = require('mysql2')
// Create the connection to the database
const connection = mysql.createConnection(process.env.DATABASE_URL)
const express = require('express')
const app = express()
app.use(express.json())

const port = 3000;

const cors = require('cors');
app.use(cors());

// 사용자 추가
app.post('/users/add', (req, res) => {
    const { name, generation } = req.body;
    connection.query('INSERT INTO UserInfo (name, generation) VALUES (?, ?)',
        [name, generation], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'User added successfully' });
        });
});

// 사용자 목록과 메시지 개수 조회
app.get('/users', (req, res) => {
    connection.query('SELECT * FROM UserInfo', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

//id로 사용자 조회
app.get('/users/id', (req, res) => {
    const { name, generation } = req.query;
    connection.query(
        'SELECT * FROM UserInfo WHERE name = ? AND generation = ?',
        [name, generation],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length > 0) {
                res.json(results[0]);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        }
    );
});


// 메시지 추가
app.post('/messages/add', (req, res) => {
    const { user_id, message, password } = req.body;
    connection.query('INSERT INTO UserMessages (user_id, message, password) VALUES (?, ?, ?)',
        [user_id, message, password], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Message added successfully' });
        });
});


// 메시지 삭제
app.delete('/messages/delete', (req, res) => {
    const { user_id, message, password } = req.body;
    connection.query(
        'SELECT password FROM UserMessages WHERE user_id = ? AND message = ?',
        [user_id, message],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length > 0) {
                const dbPassword = results[0].password;
                if (dbPassword === password) {
                    // 비밀번호가 일치하면 메시지 삭제
                    connection.query(
                        'DELETE FROM UserMessages WHERE user_id = ? AND message = ?',
                        [user_id, message],
                        (deleteErr) => {
                            if (deleteErr) {
                                return res.status(500).json({ error: deleteErr.message });
                            }
                            res.json({ message: 'Message deleted successfully' });
                        }
                    );
                } else {
                    res.status(401).json({ error: 'Incorrect password' });
                }
            } else {
                res.status(404).json({ message: 'Message not found' });
            }
        }
    );
});

//메시지 수정
app.put('/messages/adjust', (req, res) => {
    const { user_id, oldMessage, newMessage, password } = req.body;
    connection.query(
        'SELECT password FROM UserMessages WHERE user_id = ? AND message = ?',
        [user_id, oldMessage],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length > 0) {
                const dbPassword = results[0].password;
                if (dbPassword === password) {
                    // 비밀번호가 일치하면 메시지 수정
                    connection.query(
                        'UPDATE UserMessages SET message = ? WHERE user_id = ? AND message = ?',
                        [newMessage, user_id, oldMessage],
                        (updateErr) => {
                            if (updateErr) {
                                return res.status(500).json({ error: updateErr.message });
                            }
                            res.json({ message: 'Message updated successfully' });
                        }
                    );
                } else {
                    res.status(401).json({ error: 'Incorrect password' });
                }
            } else {
                res.status(404).json({ message: 'Message not found' });
            }
        }
    );
});

app.get('/messages', (req, res) => {
    const query = `
        SELECT 
            UserMessages.user_id,
            UserInfo.name, 
            UserInfo.generation AS number, 
            UserMessages.message,
            UserMessages.password
        FROM 
            UserMessages
        INNER JOIN 
            UserInfo ON UserMessages.user_id = UserInfo.id
    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});



// 활성화
app.put('/messages/activate', (req, res) => {
    const { user_id, message } = req.body;
    connection.query('UPDATE UserMessages SET active = 1 WHERE user_id = ? AND message = ?',
        [user_id, message], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Message activated successfully' });
        });
});

// 비활성화
app.put('/messages/deactivate', (req, res) => {
    const { user_id, message } = req.body;
    connection.query('UPDATE UserMessages SET active = 0 WHERE user_id = ? AND message = ?',
        [user_id, message], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Message deactivated successfully' });
        });
});

app.listen(port, () => {
    console.log(`Server running on http://127.0.0.1:${port}`);
});