# 댕산책 API 서버 이미지 (Render 등에서 빌드)
# 키가 든 application-local.yml 은 .dockerignore 로 이미지에 넣지 않는다. 운영 값은 모두 환경 변수로 받는다.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
COPY src src
# Windows 에서 받은 파일은 줄바꿈이 달라 실행되지 않을 수 있다
RUN sed -i 's/\r$//' gradlew && sh gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre
COPY --from=build /src/build/libs/*-SNAPSHOT.jar /app.jar
# 서버가 뚫려도 컨테이너 안에서 관리자 권한을 갖지 않게 일반 사용자로 실행한다
RUN useradd --system --create-home app && mkdir -p /data/uploads && chown app /data/uploads
USER app
ENV SPRING_PROFILES_ACTIVE=prod \
    STORAGE_LOCAL_DIR=/data/uploads
# 무료 서버는 메모리가 작아서 JVM 이 적게 쓰도록 맞춘다
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-Xss512k", "-jar", "/app.jar"]
