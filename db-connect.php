<?php
require_once 'auth.php';
requireLogin();
?>
<!DOCTYPE html>
<html lang="sk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Generator - UKstav Admin</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background: #1e40af;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #1e3a8a;
        }
        #result {
            margin-top: 20px;
            padding: 15px;
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 4px;
            display: none;
        }
        .link {
            word-break: break-all;
            background: white;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }
        .nav-links {
            margin-bottom: 20px;
        }
        .nav-links a {
            display: inline-block;
            padding: 10px 15px;
            margin-top: 5px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-right: 10px;
        }
        .nav-links a:hover { background: #2563eb; }
    </style>
</head>
<body>
<h1>Створення токена для клієнта</h1>

<div class="nav-links">
    <a href="manage-tokens.php">📋 Управління токенами</a>
    <a href="logout.php" style="background: #ef4444;">🚪 Вийти</a>
</div>

<form id="tokenForm">
    <div class="form-group">
        <label for="projectId">Проєкт *</label>
        <select id="projectId" required>
            <option value="">Виберіть проєкт</option>
            <!-- Опції будуть заповнені за допомогою JavaScript -->
        </select>
    </div>

    <div class="form-group">
        <label for="customerName">Ім’я клієнта</label>
        <input type="text" id="customerName">
    </div>

    <div class="form-group">
        <label for="customerEmail">Електронна пошта клієнта</label>
        <input type="email" id="customerEmail">
    </div>

    <div class="form-group">
        <label for="customerPhone">Телефон клієнта</label>
        <input type="tel" id="customerPhone">
    </div>

    <button type="submit">Згенерувати токен</button>
</form>

<div id="result">
    <h3>Токен успішно створено!</h3>
    <p><strong>Токен:</strong> <span id="tokenValue"></span></p>
    <p><strong>Посилання для клієнта:</strong></p>
    <div class="link" id="tokenLink"></div>
    <button onclick="copyLink()">Скопіювати посилання</button>
</div>


<script>
    document.getElementById('tokenForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            project_id: document.getElementById('projectId').value,
            customer_name: document.getElementById('customerName').value,
            customer_email: document.getElementById('customerEmail').value,
            customer_phone: document.getElementById('customerPhone').value
        };

        try {
            const response = await fetch('../db/generate-token.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('tokenValue').textContent = result.token;
                document.getElementById('tokenLink').textContent = result.link;
                document.getElementById('result').style.display = 'block';
            } else {
                alert('Помилка: ' + result.message);
            }
        } catch (error) {
            alert('Помилка під час створення токена');
            console.error(error);
        }
    });

    function copyLink() {
        const link = document.getElementById('tokenLink').textContent;
        navigator.clipboard.writeText(link);
        alert('Посилання скопійовано!');
    }
</script>
<script src="../projects.js"></script>
<script src="../scripts.js"></script>
<script>
    const projectSelect = document.getElementById('projectId');
    if (typeof PROJECTS !== 'undefined') {
        Object.keys(PROJECTS).forEach(projectId => {
            const option = document.createElement('option');
            option.value = projectId;
            option.textContent = PROJECTS[projectId].title;
            projectSelect.appendChild(option);
        });
    } else {
        console.error('Проєкти не знайдено. Переконайтеся, що scripts.js підключено.');
    }
</script>
</body>
</html>