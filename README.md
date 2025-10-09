## Requirements
- Python

Possibly missing python packages will be installed during the installation process.

## Installation

```bash
git clone https://github.com/PitoDevID/django.git
cd django
python -m venv myenv
myenv\Scipts\activate\
pip install -r requirements.txt
```
## Usage

Type `python manage.py command` example `python manage.py runsever` to run the server.

#### Command-Line Arguments


| command           | Explanation                                                     |
| ----------------- | --------------------------------------------------------------- |
| `runserver`       | Run the Django development server (default port: 8000).         |
| `createsuperuser` | Create an admin account for accessing the Django admin panel.   |
| `makemigrations`  | Generate migration files for changes made to models.            |
| `migrate`         | Apply database migrations.                                      |
| `shell`           | Open an interactive Python shell within the Django environment. |
| `showmigrations`  | List all migrations and their statuses.                         |
