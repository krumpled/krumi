import Game from '@krumpled/krumi/routes/game/index';
import { Poll as PollGame, Create as NewGame } from '@krumpled/krumi/routes/new-game/index';
import JoinLobby from '@krumpled/krumi/routes/join-lobby/index';
import NewLobby from '@krumpled/krumi/routes/new-lobby/index';
import PollLobby from '@krumpled/krumi/routes/poll-lobby/index';
import Home from '@krumpled/krumi/routes/home/index';
import Lobby from '@krumpled/krumi/routes/lobby/index';
import Login from '@krumpled/krumi/routes/login';
import Logout from '@krumpled/krumi/routes/logout';

export { Game, PollGame, PollLobby, Lobby, Home, NewGame, NewLobby, Login, Logout, JoinLobby };
