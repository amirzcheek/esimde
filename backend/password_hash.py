from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("admin"))

scp "C:\Users\amirz\Downloads\esimdehorizontal - 16.09.mp4" ubuntu@35868:/var/www/esimde/frontend/dist/videos/video.mp4

scp "C:\Users\amirz\Downloads\esimdehorizontal - 16.09.mp4" root@213.155.23.144:/var/www/esimde/frontend/dist/videos/video.mp4