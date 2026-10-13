import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CLIENT_ID,
  ERROR_MESSAGES,
  MapErrorView,
  type MapError,
  type NaverWebMapProps,
} from './naverMapCommon';
import { MY_LOCATION_COLOR, naverMapScriptUrl } from './naverMapHtml';

// 웹(npx expo start --web)용. react-native-webview 가 웹을 지원하지 않아서, 네이버 지도를 이 페이지에 직접 띄움
// (iframe 으로 띄우면 페이지 주소가 about:srcdoc 이 되어 네이버 인증이 통과되지 않음)
// 네이버 콘솔 "Web 서비스 URL" 에 개발 서버 주소(예: http://localhost:8081)를 등록해야 함

// 네이버 지도 JS SDK 는 타입 정의가 없어 필요한 만큼만 any 로 다룸
type NaverMaps = any;
type NaverWindow = Window & {
  naver?: { maps?: NaverMaps };
  navermap_authFailure?: () => void;
};
const naverWindow = window as NaverWindow;

// 지도 SDK 스크립트는 페이지에 한 번만 넣음 (지도 탭을 다시 열어도 재사용)
let scriptPromise: Promise<void> | null = null;

function loadNaverMaps(clientId: string): Promise<void> {
  if (naverWindow.naver?.maps) {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = naverMapScriptUrl(clientId);
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // 다음에 다시 시도할 수 있도록 실패한 스크립트는 정리
        scriptPromise = null;
        script.remove();
        reject(new Error('naver maps script load failed'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export function NaverWebMap({ initialCamera, myLocation, follow, onUserGesture, style }: NaverWebMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMaps>(null);
  const myMarkerRef = useRef<NaverMaps>(null);
  const myCircleRef = useRef<NaverMaps>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<MapError | null>(CLIENT_ID ? null : 'missingClientId');

  // 처음 값만 쓰고(지도는 한 번만 생성), 콜백은 최신 것을 ref 로 참조
  const initialCameraRef = useRef(initialCamera);
  const onUserGestureRef = useRef(onUserGesture);
  onUserGestureRef.current = onUserGesture;

  // 지도 생성
  useEffect(() => {
    if (!CLIENT_ID) {
      return;
    }
    let cancelled = false;
    // Client ID 가 틀렸거나 Web 서비스 URL 이 등록되지 않으면 네이버 SDK 가 이 함수를 호출함
    naverWindow.navermap_authFailure = () => {
      if (!cancelled) {
        setError('authFailure');
      }
    };

    loadNaverMaps(CLIENT_ID)
      .then(() => {
        const maps = naverWindow.naver?.maps;
        if (cancelled || !containerRef.current) {
          return;
        }
        if (!maps) {
          setError('loadError');
          return;
        }
        const camera = initialCameraRef.current;
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(camera.latitude, camera.longitude),
          zoom: camera.zoom,
          zoomControl: false,
          scaleControl: false,
          mapDataControl: false,
        });
        // 사용자가 지도를 직접 움직이면 "내 위치 따라가기"를 끔
        maps.Event.addListener(map, 'dragstart', () => onUserGestureRef.current?.());
        mapRef.current = map;
        setIsReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError('loadError');
        }
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      myMarkerRef.current = null;
      myCircleRef.current = null;
    };
  }, []);

  // 내 위치 점·오차 원 갱신 + 따라가기
  useEffect(() => {
    const maps = naverWindow.naver?.maps;
    const map = mapRef.current;
    // 인증 실패 시 네이버 SDK 가 naver.maps 를 비우므로 그때는 그리지 않음
    if (!isReady || !myLocation || !maps || !map) {
      return;
    }
    const position = new maps.LatLng(myLocation.latitude, myLocation.longitude);
    if (!myMarkerRef.current) {
      myMarkerRef.current = new maps.Marker({
        map,
        position,
        icon: {
          content: `<div style="width:14px;height:14px;border-radius:50%;background:${MY_LOCATION_COLOR};border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.35)"></div>`,
          anchor: new maps.Point(10, 10),
        },
        zIndex: 100,
      });
      myCircleRef.current = new maps.Circle({
        map,
        center: position,
        radius: 0,
        strokeOpacity: 0,
        fillColor: MY_LOCATION_COLOR,
        fillOpacity: 0.15,
        clickable: false,
      });
    } else {
      myMarkerRef.current.setPosition(position);
      myCircleRef.current?.setCenter(position);
    }
    myCircleRef.current?.setRadius(myLocation.accuracy ?? 0);
    if (follow) {
      map.panTo(position);
    }
  }, [isReady, myLocation, follow]);

  if (error === 'missingClientId') {
    return <MapErrorView style={style} message={ERROR_MESSAGES[error]} />;
  }

  return (
    <View style={style}>
      {createElement('div', { ref: containerRef, style: { height: '100%', width: '100%' } })}
      {error && <MapErrorView style={StyleSheet.absoluteFill} message={ERROR_MESSAGES[error]} />}
    </View>
  );
}
