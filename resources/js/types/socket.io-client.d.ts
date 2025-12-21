declare module 'socket.io-client' {
    import { ManagerOptions, SocketOptions, Socket } from "socket.io-client/build/esm/socket";
    import { Manager } from "socket.io-client/build/esm/manager";

    export function io(uri: string, opts?: Partial<ManagerOptions & SocketOptions>): Socket;
    export function io(opts?: Partial<ManagerOptions & SocketOptions>): Socket;
    export { Socket, Manager, ManagerOptions, SocketOptions };
    export default io;
}
