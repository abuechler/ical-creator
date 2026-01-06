@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.2
@REM
@REM Optional ENV vars
@REM   MVNW_REPOURL - repo url base for downloading maven distribution
@REM   MVNW_USERNAME/MVNW_PASSWORD - user and password for downloading maven
@REM   MVNW_VERBOSE - true: enable verbose log; others: silence the output
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE__=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$scriptDir='%~dp0telerik.mvn\wrapper'; Get-Content -Path (Join-Path $scriptDir maven-wrapper.properties) | ForEach-Object { if($_ -match '^(distributionUrl)=(.*)') { [System.Uri]$uri=($Matches[2].Trim() -replace '\\(?=googl)',''); $path=$uri.LocalPath.Split('/')[-1]; if($path -match 'apache-maven-([0-9.]+)') { @{'MVNW_CMD__'='mvn'+'%__MVNW_ARG0_NAME__%'.Substring(4); 'path'=$path; 'hash'=($uri.ToString().GetHashCode() -band [int]::MaxValue).ToString('x8')} } elseif($path -match 'maven-mvnd-') { @{'MVNW_CMD__'='mvnd.cmd'; 'path'=$path; 'hash'=($uri.ToString().GetHashCode() -band [int]::MaxValue).ToString('x8')} } | ForEach-Object { $_.GetEnumerator() | ForEach-Object { '{0}={1}' -f $_.Key, $_.Value }}}}}}"`) DO @(
  IF "%%A"=="MVNW_CMD__" SET "__MVNW_CMD__=%%B"
  IF "%%A"=="path" SET "__MVNW_PATH__=%%B"
  IF "%%A"=="hash" SET "__MVNW_HASH__=%%B"
)
@SET "PSModulePath=%__MVNW_PSMODULEP_SAVE__%"
@IF "%__MVNW_CMD__%"=="" (
  @SET "__MVNW_ERROR__=Could not parse maven-wrapper.properties"
  @GOTO :ERROR
)
@SET "__MVNW_MAVEN_HOME__=%USERPROFILE%\.m2\wrapper\dists\%__MVNW_PATH__%\%__MVNW_HASH__%"
@IF EXIST "%__MVNW_MAVEN_HOME__%\bin\%__MVNW_CMD__%" GOTO :EXEC

@SET __MVNW_WRAPPER_URI__=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar
@FOR /F "usebackq tokens=1* delims==" %%A IN ("%~dp0telerik.mvn\wrapper\maven-wrapper.properties") DO @(
  IF "%%A"=="wrapperUrl" SET "__MVNW_WRAPPER_URI__=%%B"
)

@powershell -noprofile -exec bypass -c ^
  "$uri='%__MVNW_WRAPPER_URI__%'; $f='%TEMP%\maven-wrapper.jar'; $t='%TEMP%\maven-wrapper-%RANDOM%.jar'; "^
  "if(-not (Test-Path $f)) { "^
  "  if('%MVNW_VERBOSE%' -eq 'true') { Write-Output ('Downloading from: ' + $uri + ' to: ' + $t) }; "^
  "  try { "^
  "    if('%MVNW_USERNAME%' -ne '' -and '%MVNW_PASSWORD%' -ne '') { "^
  "      $c=New-Object System.Net.WebClient; "^
  "      $c.Credentials=New-Object System.Net.NetworkCredential('%MVNW_USERNAME%','%MVNW_PASSWORD%'); "^
  "      $c.DownloadFile($uri,$t) "^
  "    } else { "^
  "      [Net.ServicePointManager]::SecurityProtocol=[Enum]::ToObject([Net.SecurityProtocolType], 3072); "^
  "      Invoke-WebRequest -Uri $uri -OutFile $t "^
  "    } "^
  "  } catch { "^
  "    if('%MVNW_VERBOSE%' -eq 'true') { Write-Output $_.Exception }; "^
  "  }; "^
  "  if('%MVNW_VERBOSE%' -eq 'true') { Write-Output ('Downloaded to: ' + $t) }; "^
  "  Move-Item -Path $t -Destination $f -Force "^
  "}; "^
  "if(Test-Path $f) { Write-Output ('MAVEN_WRAPPER_JAR=' + $f) }"
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {(gc '%~dp0telerik.mvn\wrapper\maven-wrapper.properties') | ForEach-Object {if ($_ -match '^(distributionUrl)=(.*)') { Write-Output ('MVNW_DOWNLOAD_URL=' + $Matches[2].Trim()) }}}"`) DO (
  SET "%%A%%B"
)

@powershell -exec bypass -noprofile -c ^
  "$jh='%JAVA_HOME%'.Trim(); $jc=if($jh -ne '') {$jh + '\bin\java.exe'} else {'java.exe'}; "^
  "$u='%MVNW_DOWNLOAD_URL%'; $d='%__MVNW_MAVEN_HOME__%'; "^
  "if('%MVNW_VERBOSE%' -eq 'true') { Write-Output ('Running: ' + $jc + ' -cp ' + '%TEMP%\maven-wrapper.jar' + ' org.apache.maven.wrapper.MavenWrapperMain ' + $u + ' ' + $d) }; "^
  "& $jc -cp '%TEMP%\maven-wrapper.jar' org.apache.maven.wrapper.MavenWrapperMain $u $d"
@IF %ERRORLEVEL% NEQ 0 (
  @SET "__MVNW_ERROR__=Error downloading maven distribution"
  @GOTO :ERROR
)

:EXEC
@SET MAVEN_PROJECTBASEDIR=%~dp0
"%__MVNW_MAVEN_HOME__%\bin\%__MVNW_CMD__%" %*
@IF %ERRORLEVEL% NEQ 0 EXIT /B %ERRORLEVEL%
@ENDLOCAL
@GOTO :EOF

:ERROR
@ECHO %__MVNW_ERROR__%
@PAUSE
@ENDLOCAL
@EXIT /B 1
