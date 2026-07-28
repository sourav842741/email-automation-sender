@echo off
cd /d "%~dp0jobs_scraper"
python run.py --once >> "..\scrape_log.txt" 2>&1
